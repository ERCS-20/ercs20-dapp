"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import { MinusIcon, PlusIcon } from "lucide-react";

import { parseUnits } from "viem";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPerpsExchangeConfigured } from "@/lib/config/perps-exchange";
import { getDefaultDecimals } from "@/lib/config/public-env";
import { buildPlaceOrderFields, enginePriceToPriceX18 } from "@/lib/perps/build-place-order";
import {
  CONDITIONAL_ORDER_TRIGGER_LIMIT,
  priceInputToX18,
  TRIGGER_PRICE_LAST,
  triggerDirectionAgainstPrice,
} from "@/lib/perps/conditional-order";
import { formatEnginePrice } from "@/lib/perps/mark-price";
import {
  clampPerpsLeverage,
  leverageToStopIndex,
  marginFromNotional,
  PERPS_LEVERAGE_DEFAULT,
  PERPS_LEVERAGE_MAX,
  PERPS_LEVERAGE_MIN,
  PERPS_LEVERAGE_STOPS,
  previewIsolatedLiqPrice,
  readCachedPerpsLeverage,
  stopIndexToLeverage,
  writeCachedPerpsLeverage,
} from "@/lib/perps/leverage";
import { getPerpsOrderErrorMessage } from "@/lib/perps/order-error-message";
import {
  normalizePlaceOrderAmounts,
  parseEnginePrice,
} from "@/lib/market/order-place-amounts";
import { orderQuoteAmountBaseUnits } from "@/lib/perps/pair-api";
import { debugPlaceOrder } from "@/lib/perps/place-order-debug";
import { getPlaceOrderSignTypedData } from "@/lib/perps/place-order-eip712";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import { formatBalance } from "@/lib/utils/format/balance";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type { PerpsPair, PerpsSide } from "@/lib/perps/types";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  useOrderSalt,
  usePerpsOrdersUserBalance,
  usePlaceConditionalOrder,
  usePlaceOrder,
} from "@/services/perps/orders/hooks";

function sanitizeDecimal(raw: string): string {
  let x = raw.replace(/[^\d.]/g, "");
  const dot = x.indexOf(".");
  if (dot !== -1) {
    x = x.slice(0, dot + 1) + x.slice(dot + 1).replace(/\./g, "");
  }
  return x;
}

/** Fraction digits after dropping trailing zeros, matching `parseUnits`. */
function priceFractionDigits(raw: string): number {
  const dot = raw.indexOf(".");
  if (dot < 0) return 0;
  return raw.slice(dot + 1).replace(/0+$/, "").length;
}

function parseAvailableBalance(raw: string): number {
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatInputDecimal(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return sanitizeDecimal(
    value.toLocaleString(undefined, { maximumFractionDigits: 8, useGrouping: false })
  );
}

/** Price for submit: typed input first, else last market price (same as effectivePrice). */
function resolveSubmitPriceString(priceInput: string, fallbackPrice: number): string | null {
  const trimmed = sanitizeDecimal(priceInput);
  const p = Number(trimmed);
  if (Number.isFinite(p) && p > 0) return trimmed;
  if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) {
    return formatInputDecimal(fallbackPrice) || null;
  }
  return null;
}

type PerpsOrderMode = "limit" | "trigger";

function currentPriceInput(lastPrice: number, enginePriceDecimal: number): string {
  return formatEnginePrice(lastPrice, enginePriceDecimal)?.input ?? "";
}

function triggerPriceGuide(
  t: (path: string) => string,
  triggerRaw: string,
  lastPrice: number,
  enginePriceDecimal: number | null | undefined
): { note?: string; error?: string } {
  if (enginePriceDecimal == null || priceInputToX18(triggerRaw, enginePriceDecimal) == null) {
    return {};
  }
  const current = currentPriceInput(lastPrice, enginePriceDecimal);
  if (priceInputToX18(current, enginePriceDecimal) == null) {
    return { error: t("perps.closeNoCurrent") };
  }
  const direction = triggerDirectionAgainstPrice(triggerRaw, current, enginePriceDecimal);
  if (direction === 1) return { note: t("perps.triggerAbove") };
  if (direction === 2) return { note: t("perps.triggerBelow") };
  return { error: t("perps.triggerMustDiffer") };
}

function readTriggerLimit(
  t: (path: string) => string,
  triggerPrice: string,
  lastPrice: number,
  enginePriceDecimal: number
): { triggerPriceX18: bigint; triggerDirection: 1 | 2 } | { error: string } {
  if (priceFractionDigits(triggerPrice) > enginePriceDecimal) {
    return {
      error: t("perps.priceDecimalLimit").replace("{digits}", String(enginePriceDecimal)),
    };
  }
  const current = currentPriceInput(lastPrice, enginePriceDecimal);
  if (priceInputToX18(current, enginePriceDecimal) == null) {
    return { error: t("perps.closeNoCurrent") };
  }
  const triggerPriceX18 = priceInputToX18(triggerPrice, enginePriceDecimal);
  const triggerDirection = triggerDirectionAgainstPrice(
    triggerPrice,
    current,
    enginePriceDecimal
  );
  if (triggerPriceX18 == null) return { error: t("perps.invalidPrice") };
  if (triggerDirection == null) return { error: t("perps.triggerMustDiffer") };
  return { triggerPriceX18, triggerDirection };
}

function readIsolatedMargin(
  marginInput: string,
  quoteAmount: bigint,
  leverage: number
): bigint | undefined {
  const marginRaw = marginInput.trim();
  if (marginRaw) {
    try {
      const parsed = parseUnits(marginRaw, getDefaultDecimals());
      if (parsed > BigInt(0)) return parsed;
    } catch {
      // Invalid text falls through to leverage-derived margin.
    }
  }
  return marginFromNotional(quoteAmount, leverage) ?? undefined;
}

/** Quantity sizing ignores side; preview both directions from one normalized size. */
function previewFormLiqPrices(input: {
  price: string;
  lastPrice: number;
  quantity: string;
  leverage: number;
  marginInput: string;
  enginePriceDecimal: number | null | undefined;
  minCollateralX18: bigint | null | undefined;
}): { buy: number | null; sell: number | null } {
  const none = { buy: null, sell: null };
  const { minCollateralX18, enginePriceDecimal } = input;
  if (minCollateralX18 == null || minCollateralX18 <= BigInt(0)) return none;
  if (enginePriceDecimal == null) return none;

  const submitPrice = resolveSubmitPriceString(input.price, input.lastPrice);
  if (submitPrice == null) return none;

  const normalized = normalizePlaceOrderAmounts({
    side: "buy",
    price: submitPrice,
    enginePriceDecimal,
    quantity: input.quantity,
    product: "perps",
  });
  if (normalized == null) return none;

  const isolatedMargin = readIsolatedMargin(
    input.marginInput,
    normalized.quoteAmount,
    input.leverage
  );
  if (isolatedMargin == null) return none;

  const shared = {
    amount: normalized.baseAmount,
    isolatedMargin,
    priceX18: enginePriceToPriceX18(normalized.enginePrice, enginePriceDecimal),
    minCollateralX18,
  };
  return {
    buy: previewIsolatedLiqPrice({ ...shared, side: "buy" }),
    sell: previewIsolatedLiqPrice({ ...shared, side: "sell" }),
  };
}

function formatLiqPrice(value: number | null, digits: number): string {
  if (value == null || !(value > 0)) return "—";
  return formatSubscriptPrice(value, digits);
}

function OrderStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const muted = value === "—";
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-muted-foreground truncate text-[11px] leading-none">{label}</p>
      <p
        className={cn(
          "mt-1.5 truncate text-sm font-medium tabular-nums",
          muted ? "text-muted-foreground" : (tone ?? "text-foreground")
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OrderModeSwitch({
  mode,
  onModeChange,
}: {
  mode: PerpsOrderMode;
  onModeChange: (mode: PerpsOrderMode) => void;
}) {
  const { t } = useI18n();
  const options = [
    { id: "limit" as const, label: t("perps.limit") },
    { id: "trigger" as const, label: t("perps.conditional") },
  ];
  return (
    <div
      className="bg-muted grid h-9 grid-cols-2 rounded-lg p-0.5"
      role="radiogroup"
      aria-label={`${options[0].label} / ${options[1].label}`}
    >
      {options.map((option) => {
        const selected = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onModeChange(option.id)}
            className={cn(
              "rounded-md text-sm font-medium transition-colors duration-200",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PerpsOrderForm({
  pair,
  price,
  quantity,
  lastPrice,
  onPriceChange,
  onQuantityChange,
  onOrderPlaced,
  className,
}: {
  pair: PerpsPair;
  price: string;
  quantity: string;
  lastPrice: number;
  onPriceChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onOrderPlaced?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { address, isConnected, chainId } = useWallet();
  const { isAuthenticated } = useAuth();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const { mutateAsync: fetchOrderSalt, isPending: isSaltPending } = useOrderSalt();
  const { mutateAsync: submitPlaceOrder, isPending: isSubmitPending } = usePlaceOrder();
  const { mutateAsync: submitConditionalOrder, isPending: isConditionalPending } =
    usePlaceConditionalOrder();
  const [sliderPct, setSliderPct] = useState(0);
  /** SSR/hydration-safe default; restore from localStorage before paint. */
  const [leverage, setLeverage] = useState(PERPS_LEVERAGE_DEFAULT);
  const [leverageInput, setLeverageInput] = useState(String(PERPS_LEVERAGE_DEFAULT));
  const [marginInput, setMarginInput] = useState("");
  const [orderMode, setOrderMode] = useState<PerpsOrderMode>("limit");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [pendingSide, setPendingSide] = useState<PerpsSide | null>(null);

  useLayoutEffect(() => {
    const cached = readCachedPerpsLeverage();
    setLeverage(cached);
    setLeverageInput(String(cached));
  }, []);

  const busy = isSigning || isSaltPending || isSubmitPending || isConditionalPending;

  const {
    data: usdcBalance,
    isLoading: isBalancesLoading,
    isFetching: isBalancesFetching,
  } = usePerpsOrdersUserBalance({
    enabled: isAuthenticated,
    notifyError: false,
  });

  const balancesPending =
    isBalancesLoading || (isBalancesFetching && usdcBalance == null);

  const availableQuote = useMemo(() => {
    if (!isAuthenticated) return "—";
    if (balancesPending) return "…";
    if (!usdcBalance) return "0";
    return formatBalance(usdcBalance.balance, getDefaultDecimals());
  }, [balancesPending, isAuthenticated, usdcBalance]);

  const effectivePrice = useMemo(() => {
    const p = Number(price);
    return Number.isFinite(p) && p > 0 ? p : lastPrice;
  }, [price, lastPrice]);

  const total = useMemo(() => {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || effectivePrice <= 0) return 0;
    return q * effectivePrice;
  }, [quantity, effectivePrice]);

  const marginPreview = useMemo(() => {
    if (total <= 0) return 0;
    return total / leverage;
  }, [total, leverage]);

  const maxOpenNotional = useMemo(() => {
    const avail = parseAvailableBalance(availableQuote);
    if (avail <= 0) return 0;
    return avail * leverage;
  }, [availableQuote, leverage]);

  const liqPrices = useMemo(
    () =>
      previewFormLiqPrices({
        price,
        lastPrice,
        quantity,
        leverage,
        marginInput,
        enginePriceDecimal: pair.enginePriceDecimal,
        minCollateralX18: pair.minCollateralX18,
      }),
    [
      lastPrice,
      leverage,
      marginInput,
      pair.enginePriceDecimal,
      pair.minCollateralX18,
      price,
      quantity,
    ]
  );

  function applyMargin(raw: string, lev = leverage) {
    const sanitized = sanitizeDecimal(raw);
    setMarginInput(sanitized);
    setSliderPct(0);

    const margin = Number(sanitized);
    if (!Number.isFinite(margin) || margin <= 0 || effectivePrice <= 0) {
      onQuantityChange("");
      return;
    }
    // amount (base) = margin × leverage / price
    const amount = (margin * lev) / effectivePrice;
    onQuantityChange(formatInputDecimal(amount));
  }

  function applyLeverage(next: number) {
    const lev = clampPerpsLeverage(next);
    setLeverage(lev);
    setLeverageInput(String(lev));
    writeCachedPerpsLeverage(lev);
    if (sliderPct > 0) {
      applyPct(sliderPct, lev);
    } else if (marginInput.trim()) {
      applyMargin(marginInput, lev);
    }
  }

  function commitLeverageInput() {
    const parsed = Number(leverageInput.replace(/[^\d]/g, ""));
    applyLeverage(Number.isFinite(parsed) ? parsed : leverage);
  }

  function applyPct(pct: number, lev = leverage) {
    setSliderPct(pct);
    if (effectivePrice <= 0) return;

    const ratio = pct / 100;
    const quoteAvail = parseAvailableBalance(availableQuote);
    if (quoteAvail <= 0) return;
    // Size % = share of available balance used as margin → notional = margin × leverage.
    const marginUse = quoteAvail * ratio;
    setMarginInput(formatInputDecimal(marginUse));
    const amount = (marginUse * lev) / effectivePrice;
    onQuantityChange(formatInputDecimal(amount));
  }

  function handleSubmit(side: PerpsSide) {
    debugPlaceOrder("submit:start", {
      side,
      priceRaw: price,
      quantityRaw: quantity,
      priceNumber: Number(price),
      quantityNumber: Number(quantity),
      lastPrice,
      effectivePrice,
      enginePriceDecimal: pair.enginePriceDecimal,
      sliderPct,
      leverage,
      pairId: pair.pairId,
      chainId,
    });

    if (!isConnected || !address) {
      toast.message(t("perps.connectToTrade"));
      return;
    }
    if (!isAuthenticated) {
      toast.error(t("auth.loginTitle"));
      return;
    }
    if (!isPerpsExchangeConfigured()) {
      toast.error(t("perps.exchangeNotConfigured"));
      return;
    }
    if (pair.pairId == null || pair.enginePriceDecimal == null) {
      toast.error(t("perps.orderFailed"));
      return;
    }
    if (chainId == null) {
      toast.error(t("perps.orderFailed"));
      return;
    }

    const userBalanceId = usdcBalance?.userBalanceId;
    // No balance row yet (never deposited) — treat as insufficient, not generic failure.
    if (userBalanceId == null) {
      toast.error(t("perps.insufficientBalance"));
      return;
    }

    const q = Number(quantity);
    const submitPrice = resolveSubmitPriceString(price, lastPrice);
    const p = submitPrice != null ? Number(submitPrice) : NaN;
    if (!Number.isFinite(q) || q <= 0) {
      debugPlaceOrder("submit:reject", { reason: "invalidAmount", quantity, q });
      toast.error(t("perps.invalidAmount"));
      return;
    }
    if (submitPrice == null || !Number.isFinite(p) || p <= 0) {
      debugPlaceOrder("submit:reject", {
        reason: "invalidPrice",
        price,
        submitPrice,
        p,
        lastPrice,
        effectivePrice,
      });
      toast.error(t("perps.invalidPrice"));
      return;
    }

    const enginePriceDecimal = pair.enginePriceDecimal;
    if (priceFractionDigits(submitPrice) > enginePriceDecimal) {
      debugPlaceOrder("submit:reject", {
        reason: "priceDecimalLimit",
        submitPrice,
        enginePriceDecimal,
      });
      toast.error(
        t("perps.priceDecimalLimit").replace("{digits}", String(enginePriceDecimal))
      );
      return;
    }
    debugPlaceOrder("submit:parseEnginePrice", {
      submitPrice,
      priceInput: price,
      enginePrice: parseEnginePrice(submitPrice, enginePriceDecimal)?.toString(),
      enginePriceDecimal,
    });

    const triggerLimit =
      orderMode === "trigger"
        ? readTriggerLimit(t, triggerPrice, lastPrice, enginePriceDecimal)
        : null;
    if (triggerLimit && "error" in triggerLimit) {
      toast.error(triggerLimit.error);
      return;
    }

    const quoteAmount = orderQuoteAmountBaseUnits(
      quantity,
      submitPrice,
      enginePriceDecimal,
      side
    );
    debugPlaceOrder("submit:normalizedQuote", {
      quoteAmount: quoteAmount?.toString(),
      leverage,
    });
    const minTrade = pair.minTradeAmount;
    if (
      minTrade != null &&
      minTrade > BigInt(0) &&
      (quoteAmount == null || quoteAmount < minTrade)
    ) {
      toast.error(
        t("perps.minTotal")
          .replace("{min}", formatBalance(minTrade, getDefaultDecimals()))
          .replace("{symbol}", pair.quoteSymbol)
      );
      return;
    }

    void (async () => {
      setPendingSide(side);
      try {
        const { salt } = await fetchOrderSalt();
        const fields = buildPlaceOrderFields({
          pairId: pair.pairId!,
          side,
          price: submitPrice,
          quantity,
          enginePriceDecimal,
          maker: address,
          salt: BigInt(salt),
          leverage,
        });

        debugPlaceOrder("submit:fields", {
          userBalanceId,
          amount: fields.amount.toString(),
          margin: fields.margin.toString(),
          priceX18: fields.priceX18.toString(),
          leverage: fields.leverage,
          side: fields.side,
          reduceOnly: 0,
          expiry: fields.expiry.toString(),
          salt: fields.salt.toString(),
        });

        const available = parseApiBigInt(usdcBalance?.balance);
        if (available == null || available < fields.margin) {
          toast.error(t("perps.insufficientBalance"));
          return;
        }

        const signature = await signTypedDataAsync(
          getPlaceOrderSignTypedData(
            {
              trader: fields.maker,
              marketId: fields.pairId,
              amount: fields.amount,
              margin: fields.margin,
              priceX18: fields.priceX18,
              isBuy: side === "buy",
              nonce: fields.salt,
              expiry: fields.expiry,
            },
            chainId
          )
        );

        const order = {
          userBalanceId,
          pairId: fields.pairId,
          maker: fields.maker,
          amount: fields.amount,
          margin: fields.margin,
          timeInForce: fields.timeInForce,
          expiry: fields.expiry,
          salt: fields.salt,
          signature,
          priceX18: fields.priceX18,
          side: fields.side,
          reduceOnly: 0 as const,
        };
        if (triggerLimit) {
          await submitConditionalOrder({
            ...order,
            orderType: CONDITIONAL_ORDER_TRIGGER_LIMIT,
            triggerPriceX18: triggerLimit.triggerPriceX18,
            triggerDirection: triggerLimit.triggerDirection,
            triggerPriceType: TRIGGER_PRICE_LAST,
          });
        } else {
          await submitPlaceOrder(order);
        }

        debugPlaceOrder("submit:success");

        toast.success(t("perps.orderPlaced"));
        setSliderPct(0);
        setMarginInput("");
        onQuantityChange("");
        onOrderPlaced?.();
      } catch (error) {
        debugPlaceOrder("submit:error", {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        toast.error(
          getPerpsOrderErrorMessage(error, t, t("perps.orderFailed"))
        );
      } finally {
        setPendingSide(null);
      }
    })();
  }

  const buyLabel = t("perps.placeBuy").replace("{symbol}", pair.baseSymbol);
  const sellLabel = t("perps.placeSell").replace("{symbol}", pair.baseSymbol);
  const triggerGuide =
    orderMode === "trigger"
      ? triggerPriceGuide(t, triggerPrice, lastPrice, pair.enginePriceDecimal)
      : {};
  const liqDigits = pair.enginePriceDecimal ?? 8;
  const maxOpenText = maxOpenNotional > 0 ? formatQuoteAmount(maxOpenNotional) : "—";
  const totalText = total > 0 ? formatQuoteAmount(total) : "—";
  const liqLongText = formatLiqPrice(liqPrices.buy, liqDigits);
  const liqShortText = formatLiqPrice(liqPrices.sell, liqDigits);
  const enginePriceDecimal = pair.enginePriceDecimal;
  const typedPrice = price.trim();
  const priceDecimalError =
    enginePriceDecimal != null &&
    typedPrice !== "" &&
    typedPrice !== "." &&
    priceFractionDigits(typedPrice) > enginePriceDecimal
      ? t("perps.priceDecimalLimit").replace("{digits}", String(enginePriceDecimal))
      : null;

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex flex-col rounded-xl border px-3 py-2 sm:px-4 sm:pb-4",
        className
      )}
      aria-label={t("perps.mobileTrade")}
    >
      <OrderModeSwitch mode={orderMode} onModeChange={setOrderMode} />

      <div className="border-input bg-background mt-3 overflow-hidden rounded-xl border">
        <div className="grid grid-cols-2 divide-x divide-border/60">
          <OrderStat
            label={`${t("perps.maxOpen")} (${pair.quoteSymbol})`}
            value={maxOpenText}
          />
          <OrderStat
            label={`${t("perps.liqPrice")}(${t("perps.long")})`}
            value={liqLongText}
            tone="text-brand"
          />
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60">
          <OrderStat
            label={`${t("perps.totalLabel")} (${pair.quoteSymbol})`}
            value={totalText}
          />
          <OrderStat
            label={`${t("perps.liqPrice")}(${t("perps.short")})`}
            value={liqShortText}
            tone="text-brand-alt"
          />
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor="perps-leverage" className="text-muted-foreground text-xs">
          {t("perps.leverage")}
        </Label>
        <div className="border-input bg-background mt-1.5 flex h-11 items-center overflow-hidden rounded-xl border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-11 shrink-0 rounded-none"
            disabled={leverage <= PERPS_LEVERAGE_MIN}
            onClick={() => applyLeverage(leverage - 1)}
            aria-label="-"
          >
            <MinusIcon className="size-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
            <Input
              id="perps-leverage"
              inputMode="numeric"
              value={leverageInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                setLeverageInput(raw);
                if (raw === "") return;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                const lev = clampPerpsLeverage(n);
                setLeverage(lev);
                writeCachedPerpsLeverage(lev);
                if (sliderPct > 0) applyPct(sliderPct, lev);
              }}
              onBlur={commitLeverageInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="h-9 w-[3.25rem] border-0 bg-transparent p-0 text-center text-base shadow-none tabular-nums focus-visible:ring-0"
              aria-valuemin={PERPS_LEVERAGE_MIN}
              aria-valuemax={PERPS_LEVERAGE_MAX}
              aria-valuenow={leverage}
            />
            <span className="text-muted-foreground text-sm leading-none">x</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-11 shrink-0 rounded-none"
            disabled={leverage >= PERPS_LEVERAGE_MAX}
            onClick={() => applyLeverage(leverage + 1)}
            aria-label="+"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
        <div className="mt-2">
          <input
            type="range"
            min={0}
            max={PERPS_LEVERAGE_STOPS.length - 1}
            step={1}
            value={leverageToStopIndex(leverage)}
            onChange={(e) => applyLeverage(stopIndexToLeverage(Number(e.target.value)))}
            className="size-slider w-full cursor-pointer"
            aria-label={t("perps.leverage")}
          />
          <div className="relative mt-1.5 h-5" aria-hidden>
            {PERPS_LEVERAGE_STOPS.map((stop, i) => (
              <button
                key={stop}
                type="button"
                tabIndex={-1}
                className={cn(
                  "absolute top-0 h-2 w-px -translate-x-1/2",
                  i === 0 || i === PERPS_LEVERAGE_STOPS.length - 1
                    ? "bg-muted-foreground/70"
                    : "bg-border",
                  leverageToStopIndex(leverage) === i && "bg-foreground"
                )}
                style={{
                  left: `${(i / (PERPS_LEVERAGE_STOPS.length - 1)) * 100}%`,
                }}
                onClick={() => applyLeverage(stop)}
              />
            ))}
            <div className="text-muted-foreground absolute inset-x-0 top-2.5 flex justify-between text-[11px] tabular-nums">
              <span>{PERPS_LEVERAGE_MIN}x</span>
              <span>50x</span>
              <span>{PERPS_LEVERAGE_MAX}x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {orderMode === "trigger" ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="perps-trigger" className="text-muted-foreground text-xs">
                {t("perps.triggerPrice")} ({pair.quoteSymbol})
              </Label>
              {triggerGuide.note ? (
                <span className="text-foreground shrink-0 text-xs font-medium">
                  {triggerGuide.note}
                </span>
              ) : null}
            </div>
            <Input
              id="perps-trigger"
              inputMode="decimal"
              autoComplete="off"
              value={triggerPrice}
              aria-invalid={triggerGuide.error ? true : undefined}
              aria-describedby={triggerGuide.error ? "perps-trigger-error" : undefined}
              onChange={(e) => setTriggerPrice(sanitizeDecimal(e.target.value))}
              placeholder={formatSubscriptPrice(lastPrice)}
              className="mt-1.5 h-11 rounded-xl tabular-nums"
            />
            {triggerGuide.error ? (
              <p id="perps-trigger-error" className="text-destructive mt-1.5 text-xs" role="alert">
                {triggerGuide.error}
              </p>
            ) : null}
          </div>
        ) : null}
        <div>
          <Label htmlFor="perps-price" className="text-muted-foreground text-xs">
            {t("perps.price")} ({pair.quoteSymbol})
          </Label>
          <Input
            id="perps-price"
            inputMode="decimal"
            value={price}
            aria-invalid={priceDecimalError != null || undefined}
            aria-describedby={priceDecimalError ? "perps-price-decimal-error" : undefined}
            onChange={(e) => {
              onPriceChange(sanitizeDecimal(e.target.value));
            }}
            onBlur={() => {
              if (sliderPct > 0) {
                applyPct(sliderPct);
              } else if (marginInput.trim()) {
                applyMargin(marginInput);
              }
            }}
            placeholder={formatSubscriptPrice(lastPrice)}
            className="mt-1.5 h-11 rounded-xl tabular-nums"
          />
          {priceDecimalError ? (
            <p id="perps-price-decimal-error" className="text-destructive mt-1.5 text-xs" role="alert">
              {priceDecimalError}
            </p>
          ) : null}
        </div>

        <div>
          <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
            <span>{t("perps.sizePct")}</span>
            <span className="tabular-nums">{sliderPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderPct}
            onChange={(e) => applyPct(Number(e.target.value))}
            className="size-slider w-full cursor-pointer"
            aria-label={t("perps.sizePct")}
          />
          <div className="mt-1 flex gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 flex-1 rounded-lg text-[11px]"
                onClick={() => applyPct(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="perps-margin" className="text-muted-foreground text-xs">
            {t("perps.marginRequired")} ({pair.quoteSymbol})
          </Label>
          <Input
            id="perps-margin"
            inputMode="decimal"
            value={marginInput}
            onChange={(e) => applyMargin(e.target.value)}
            className="mt-1.5 h-11 rounded-xl tabular-nums"
          />
        </div>

        <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
          <span>
            {t("perps.available")} {pair.quoteSymbol}
          </span>
          <span className="text-foreground">{availableQuote}</span>
        </div>
      </div>

      {isConnected ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="bg-brand text-brand-on hover:bg-brand/90 h-11 rounded-xl px-2 text-sm font-semibold"
            onClick={() => {
              debugPlaceOrder("button:click", { side: "buy" });
              handleSubmit("buy");
            }}
            disabled={busy || triggerGuide.error != null}
          >
            {busy && pendingSide === "buy" ? t("perps.placingOrder") : buyLabel}
          </Button>
          <Button
            type="button"
            className="bg-brand-alt text-brand-alt-on hover:bg-brand-alt/90 h-11 rounded-xl px-2 text-sm font-semibold"
            onClick={() => {
              debugPlaceOrder("button:click", { side: "sell" });
              handleSubmit("sell");
            }}
            disabled={busy || triggerGuide.error != null}
          >
            {busy && pendingSide === "sell" ? t("perps.placingOrder") : sellLabel}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="mt-4 h-11 w-full rounded-xl font-semibold"
          onClick={() => handleSubmit("buy")}
        >
          {t("perps.connectToTrade")}
        </Button>
      )}
    </section>
  );
}
