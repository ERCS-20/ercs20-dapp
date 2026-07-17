"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import { SpotSideSwitch } from "@/components/spot/spot-side-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSpotExchangeConfigured } from "@/lib/config/spot-exchange";
import { buildPlaceOrderFields } from "@/lib/orders/build-place-order";
import { getPlaceOrderSignTypedData } from "@/lib/orders/place-order-eip712";
import { getSpotOrderErrorMessage } from "@/lib/spot/order-error-message";
import { debugPlaceOrder } from "@/lib/spot/place-order-debug";
import { orderQuoteAmountBaseUnits } from "@/lib/spot/pair-api";
import { parseEnginePrice } from "@/lib/spot/order-place-amounts";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import { formatBalance } from "@/lib/utils/format/balance";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type { SpotPair, SpotSide } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { useOrderSalt, usePairBalances, usePlaceOrder } from "@/services/spot/orders/hooks";

const SPOT_BALANCE_DECIMALS = 18;

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

export function SpotOrderForm({
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
  pair: SpotPair;
  side: SpotSide;
  price: string;
  quantity: string;
  lastPrice: number;
  onSideChange: (s: SpotSide) => void;
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

  const busy = isSigning || isSaltPending || isSubmitPending;

  const {
    data: pairBalances,
    isLoading: isBalancesLoading,
    isFetching: isBalancesFetching,
  } = usePairBalances(pair.baseAddress, pair.quoteAddress, {
    enabled: isAuthenticated,
    notifyError: false,
  });

  const balancesPending =
    isBalancesLoading || (isBalancesFetching && pairBalances == null);

  const availableBase = useMemo(() => {
    if (!isAuthenticated) return "—";
    if (balancesPending) return "…";
    if (!pairBalances) return "0";
    return formatBalance(pairBalances.baseBalance, SPOT_BALANCE_DECIMALS);
  }, [balancesPending, isAuthenticated, pairBalances]);

  const availableQuote = useMemo(() => {
    if (!isAuthenticated) return "—";
    if (balancesPending) return "…";
    if (!pairBalances) return "0";
    return formatBalance(pairBalances.quoteBalance, SPOT_BALANCE_DECIMALS);
  }, [balancesPending, isAuthenticated, pairBalances]);

  const effectivePrice = useMemo(() => {
    const p = Number(price);
    return Number.isFinite(p) && p > 0 ? p : lastPrice;
  }, [price, lastPrice]);

  const total = useMemo(() => {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || effectivePrice <= 0) return 0;
    return q * effectivePrice;
  }, [quantity, effectivePrice]);

  function applyPct(pct: number) {
    setSliderPct(pct);
    if (effectivePrice <= 0) return;

    const ratio = pct / 100;

    if (side === "buy") {
      const quoteAvail = parseAvailableBalance(availableQuote);
      if (quoteAvail <= 0) return;
      const quoteUse = quoteAvail * ratio;
      const amount = quoteUse / effectivePrice;
      onQuantityChange(formatInputDecimal(amount));
      return;
    }

    const baseAvail = parseAvailableBalance(availableBase);
    if (baseAvail <= 0) return;
    const baseUse = baseAvail * ratio;
    const totalQuote = baseUse * effectivePrice;
    const amount = totalQuote / effectivePrice;
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
      pairId: pair.pairId,
      chainId,
    });

    if (!isConnected || !address) {
      toast.message(t("spot.connectToTrade"));
      return;
    }
    if (!isAuthenticated) {
      toast.error(t("auth.loginTitle"));
      return;
    }
    if (!isSpotExchangeConfigured()) {
      toast.error(t("spot.exchangeNotConfigured"));
      return;
    }
    if (pair.pairId == null || pair.enginePriceDecimal == null) {
      toast.error(t("spot.orderFailed"));
      return;
    }
    if (chainId == null) {
      toast.error(t("spot.orderFailed"));
      return;
    }

    const userBalanceId =
      side === "buy"
        ? pairBalances?.quoteUserBalanceId
        : pairBalances?.baseUserBalanceId;
    // No balance row yet (never deposited) — treat as insufficient, not generic failure.
    if (userBalanceId == null) {
      toast.error(t("spot.insufficientBalance"));
      return;
    }

    const q = Number(quantity);
    const submitPrice = resolveSubmitPriceString(price, lastPrice);
    const p = submitPrice != null ? Number(submitPrice) : NaN;
    if (!Number.isFinite(q) || q <= 0) {
      debugPlaceOrder("submit:reject", { reason: "invalidAmount", quantity, q });
      toast.error(t("spot.invalidAmount"));
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
      toast.error(t("spot.invalidPrice"));
      return;
    }

    const enginePriceDecimal = pair.enginePriceDecimal;
    debugPlaceOrder("submit:parseEnginePrice", {
      submitPrice,
      priceInput: price,
      enginePrice: parseEnginePrice(submitPrice, enginePriceDecimal)?.toString(),
      enginePriceDecimal,
    });

    let quoteBudget: bigint | undefined;
    if (side === "buy" && sliderPct > 0 && pairBalances) {
      const quoteBal = parseApiBigInt(pairBalances.quoteBalance);
      if (quoteBal != null && quoteBal > BigInt(0)) {
        quoteBudget = (quoteBal * BigInt(sliderPct)) / BigInt(100);
      }
    }

    const quoteAmount = orderQuoteAmountBaseUnits(
      quantity,
      submitPrice,
      enginePriceDecimal,
      side,
      quoteBudget
    );
    debugPlaceOrder("submit:normalizedQuote", {
      quoteBudget: quoteBudget?.toString(),
      quoteAmount: quoteAmount?.toString(),
    });
    const minTrade = pair.minTradeAmount;
    if (
      minTrade != null &&
      minTrade > BigInt(0) &&
      (quoteAmount == null || quoteAmount < minTrade)
    ) {
      toast.error(
        t("spot.minTotal")
          .replace("{min}", formatBalance(minTrade, SPOT_BALANCE_DECIMALS))
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
          baseTokenAddress: pair.baseAddress,
          quoteTokenAddress: pair.quoteAddress,
          maker: address,
          salt: BigInt(salt),
          quoteBudget,
        });

        debugPlaceOrder("submit:fields", {
          userBalanceId,
          makerAmount: fields.makerAmount.toString(),
          takerAmount: fields.takerAmount.toString(),
          makerToken: fields.makerToken,
          takerToken: fields.takerToken,
          expiry: fields.expiry.toString(),
          salt: fields.salt.toString(),
        });

        const available =
          side === "buy"
            ? parseApiBigInt(pairBalances?.quoteBalance)
            : parseApiBigInt(pairBalances?.baseBalance);
        if (available == null || available < fields.makerAmount) {
          toast.error(t("spot.insufficientBalance"));
          return;
        }

        const signature = await signTypedDataAsync(
          getPlaceOrderSignTypedData(
            {
              maker: fields.maker,
              makerToken: fields.makerToken,
              takerToken: fields.takerToken,
              makerAmount: fields.makerAmount,
              takerAmount: fields.takerAmount,
              expiry: fields.expiry,
              salt: fields.salt,
              timeInForce: fields.timeInForce,
            },
            chainId
          )
        );

        await submitPlaceOrder({
          userBalanceId,
          pairId: fields.pairId,
          maker: fields.maker,
          makerToken: fields.makerToken,
          takerToken: fields.takerToken,
          makerAmount: fields.makerAmount,
          takerAmount: fields.takerAmount,
          timeInForce: fields.timeInForce,
          expiry: fields.expiry,
          salt: fields.salt,
          signature,
        });

        debugPlaceOrder("submit:success");

        toast.success(t("spot.orderPlaced"));
        setSliderPct(0);
        onOrderPlaced?.();
      } catch (error) {
        debugPlaceOrder("submit:error", {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        toast.error(
          getSpotOrderErrorMessage(error, t, t("spot.orderFailed"))
        );
      }
    })();
  }

  const placeLabel =
    side === "buy"
      ? t("spot.placeBuy").replace("{symbol}", pair.baseSymbol)
      : t("spot.placeSell").replace("{symbol}", pair.baseSymbol);

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex flex-col rounded-xl border px-3 py-2 sm:px-4 sm:pb-4",
        className
      )}
      aria-label={t("spot.mobileTrade")}
    >
      <SpotSideSwitch
        side={side}
        onSideChange={(s) => {
          onSideChange(s);
          setSliderPct(0);
        }}
        buyLabel={t("spot.buy")}
        sellLabel={t("spot.sell")}
      />

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="spot-price" className="text-muted-foreground text-xs">
            {t("spot.price")} ({pair.quoteSymbol})
          </Label>
          <Input
            id="spot-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => onPriceChange(sanitizeDecimal(e.target.value))}
            placeholder={formatSubscriptPrice(lastPrice)}
            className="mt-1.5 h-11 rounded-xl tabular-nums"
          />
        </div>

        <div>
          <Label htmlFor="spot-quantity" className="text-muted-foreground text-xs">
            {t("spot.amount")} ({pair.baseSymbol})
          </Label>
          <Input
            id="spot-quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => {
              onQuantityChange(sanitizeDecimal(e.target.value));
              setSliderPct(0);
            }}
            className="mt-1.5 h-11 rounded-xl tabular-nums"
          />
        </div>

        <div>
          <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
            <span>{t("spot.sizePct")}</span>
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
            className="spot-size-slider w-full cursor-pointer"
            aria-label={t("spot.sizePct")}
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
          <Label htmlFor="spot-total" className="text-muted-foreground text-xs">
            {t("spot.totalLabel")} ({pair.quoteSymbol})
          </Label>
          <Input
            id="spot-total"
            readOnly
            value={total > 0 ? formatQuoteAmount(total) : ""}
            className="mt-1.5 h-11 rounded-xl tabular-nums"
          />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="text-muted-foreground flex justify-between tabular-nums">
            <span>
              {t("spot.available")} {pair.quoteSymbol}
            </span>
            <span className="text-foreground">{availableQuote}</span>
          </div>
          <div className="text-muted-foreground flex justify-between tabular-nums">
            <span>
              {t("spot.available")} {pair.baseSymbol}
            </span>
            <span className="text-foreground">{availableBase}</span>
          </div>
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
          ? t("spot.placingOrder")
          : isConnected
            ? placeLabel
            : t("spot.connectToTrade")}
      </Button>
    </section>
  );
}
