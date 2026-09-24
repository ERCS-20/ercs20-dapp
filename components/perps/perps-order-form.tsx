"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import { MinusIcon, PlusIcon } from "lucide-react";

import { PerpsSideSwitch } from "@/components/perps/perps-side-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPerpsExchangeConfigured } from "@/lib/config/perps-exchange";
import { getDefaultDecimals } from "@/lib/config/public-env";
import { buildPlaceOrderFields } from "@/lib/perps/build-place-order";
import {
  clampPerpsLeverage,
  estimateLiqPrice,
  leverageToStopIndex,
  PERPS_LEVERAGE_DEFAULT,
  PERPS_LEVERAGE_MAX,
  PERPS_LEVERAGE_MIN,
  PERPS_LEVERAGE_STOPS,
  readCachedPerpsLeverage,
  stopIndexToLeverage,
  writeCachedPerpsLeverage,
} from "@/lib/perps/leverage";
import { getPerpsOrderErrorMessage } from "@/lib/perps/order-error-message";
import { parseEnginePrice } from "@/lib/market/order-place-amounts";
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
import { useOrderSalt, usePerpsOrdersUserBalance, usePlaceOrder } from "@/services/perps/orders/hooks";

function sanitizeDecimal(raw: string): string {
  let x = raw.replace(/[^\d.]/g, "");
  const dot = x.indexOf(".");
  if (dot !== -1) {
    x = x.slice(0, dot + 1) + x.slice(dot + 1).replace(/\./g, "");
  }
  return x;
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

export function PerpsOrderForm({
  pair,
  side,
  price,
  quantity,
  lastPrice,
  onSideChange,
  onPriceChange,
  onQuantityChange,
  onOrderPlaced,
  className,
}: {
  pair: PerpsPair;
  side: PerpsSide;
  price: string;
  quantity: string;
  lastPrice: number;
  onSideChange: (s: PerpsSide) => void;
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
  const [sliderPct, setSliderPct] = useState(0);
  /** SSR/hydration-safe default; restore from localStorage before paint. */
  const [leverage, setLeverage] = useState(PERPS_LEVERAGE_DEFAULT);
  const [leverageInput, setLeverageInput] = useState(String(PERPS_LEVERAGE_DEFAULT));
  const [marginInput, setMarginInput] = useState("");

  useLayoutEffect(() => {
    const cached = readCachedPerpsLeverage();
    setLeverage(cached);
    setLeverageInput(String(cached));
  }, []);

  const busy = isSigning || isSaltPending || isSubmitPending;

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

  const liqPricePreview = useMemo(() => {
    if (effectivePrice <= 0) return null;
    return estimateLiqPrice({
      entryPrice: effectivePrice,
      leverage,
      side,
    });
  }, [effectivePrice, leverage, side]);

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

  function handleSubmit() {
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
    debugPlaceOrder("submit:parseEnginePrice", {
      submitPrice,
      priceInput: price,
      enginePrice: parseEnginePrice(submitPrice, enginePriceDecimal)?.toString(),
      enginePriceDecimal,
    });

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

        await submitPlaceOrder({
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
        });

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
      }
    })();
  }

  const placeLabel =
    side === "buy"
      ? t("perps.placeBuy").replace("{symbol}", pair.baseSymbol)
      : t("perps.placeSell").replace("{symbol}", pair.baseSymbol);

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex flex-col rounded-xl border px-3 py-2 sm:px-4 sm:pb-4",
        className
      )}
      aria-label={t("perps.mobileTrade")}
    >
      <PerpsSideSwitch
        side={side}
        onSideChange={(s) => {
          onSideChange(s);
          setSliderPct(0);
          setMarginInput("");
          onQuantityChange("");
        }}
        buyLabel={t("perps.buy")}
        sellLabel={t("perps.sell")}
      />

      <div className="border-input bg-background mt-3 grid grid-cols-3 gap-2 rounded-xl border px-3 py-2.5">
        <div className="min-w-0 text-left">
          <div className="text-muted-foreground text-[11px] leading-none">
            {t("perps.maxOpen")} ({pair.quoteSymbol})
          </div>
          <div className="text-foreground mt-1 truncate text-xs font-medium tabular-nums">
            {maxOpenNotional > 0 ? formatQuoteAmount(maxOpenNotional) : "—"}
          </div>
        </div>
        <div className="min-w-0 text-center">
          <div className="text-muted-foreground text-[11px] leading-none">
            {t("perps.liqPrice")}
          </div>
          <div className="text-foreground mt-1 truncate text-xs font-medium tabular-nums">
            {liqPricePreview != null && liqPricePreview > 0
              ? formatSubscriptPrice(liqPricePreview)
              : "—"}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-muted-foreground text-[11px] leading-none">
            {t("perps.totalLabel")} ({pair.quoteSymbol})
          </div>
          <div className="text-foreground mt-1 truncate text-xs font-medium tabular-nums">
            {total > 0 ? formatQuoteAmount(total) : "—"}
          </div>
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
            data-side={side}
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
        <div>
          <Label htmlFor="perps-price" className="text-muted-foreground text-xs">
            {t("perps.price")} ({pair.quoteSymbol})
          </Label>
          <Input
            id="perps-price"
            inputMode="decimal"
            value={price}
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
            data-side={side}
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

      <Button
        type="button"
        className={cn(
          "mt-4 h-11 w-full rounded-xl font-semibold",
          side === "buy"
            ? "bg-brand hover:bg-brand/90 text-brand-on"
            : "bg-brand-alt hover:bg-brand-alt/90 text-brand-alt-on"
        )}
        onClick={() => {
          debugPlaceOrder("button:click");
          handleSubmit();
        }}
        disabled={busy}
      >
        {busy
          ? t("perps.placingOrder")
          : isConnected
            ? placeLabel
            : t("perps.connectToTrade")}
      </Button>
    </section>
  );
}
