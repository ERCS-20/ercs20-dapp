"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SpotSideSwitch } from "@/components/spot/spot-side-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_ORDER_TOTAL } from "@/lib/spot/mock-market";
import { formatSpotPrice, formatSpotTotal } from "@/lib/spot/format";
import type { SpotOrder, SpotPair, SpotSide } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

function sanitizeDecimal(raw: string): string {
  let x = raw.replace(/[^\d.]/g, "");
  const dot = x.indexOf(".");
  if (dot !== -1) {
    x = x.slice(0, dot + 1) + x.slice(dot + 1).replace(/\./g, "");
  }
  return x;
}

export function SpotOrderForm({
  pair,
  side,
  price,
  quantity,
  lastPrice,
  availableBase,
  availableQuote,
  onSideChange,
  onPriceChange,
  onQuantityChange,
  onPlaceOrder,
  className,
}: {
  pair: SpotPair;
  side: SpotSide;
  price: string;
  quantity: string;
  lastPrice: number;
  availableBase: string;
  availableQuote: string;
  onSideChange: (s: SpotSide) => void;
  onPriceChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onPlaceOrder: (order: Omit<SpotOrder, "id" | "createdAt" | "status">) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { isConnected } = useWallet();
  const [sliderPct, setSliderPct] = useState(0);

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
    const avail = side === "buy" ? Number(availableQuote) : Number(availableBase);
    if (!Number.isFinite(avail) || avail <= 0) return;
    const p = Number(price);
    if (side === "buy") {
      const usePrice = Number.isFinite(p) && p > 0 ? p : lastPrice;
      if (usePrice <= 0) return;
      onQuantityChange(sanitizeDecimal(String((avail / usePrice) * (pct / 100))));
    } else {
      onQuantityChange(sanitizeDecimal(String(avail * (pct / 100))));
    }
  }

  function handleSubmit() {
    if (!isConnected) {
      toast.message(t("spot.connectToTrade"));
      return;
    }
    const q = Number(quantity);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error(t("spot.invalidAmount"));
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error(t("spot.invalidPrice"));
      return;
    }
    if (p * q < MIN_ORDER_TOTAL) {
      toast.error(t("spot.minTotal").replace("{min}", String(MIN_ORDER_TOTAL)));
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const txHash = `0x${Date.now().toString(16).padStart(64, "0")}`;

    onPlaceOrder({
      orderId,
      pairLabel: `${pair.baseSymbol}/${pair.quoteSymbol}`,
      side,
      price: p,
      amount: q,
      filled: 0,
      average: 0,
      fee: 0,
      cancelStatus: "normal",
      txHash,
    });
    toast.success(t("spot.orderPlaced"));
    setSliderPct(0);
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
            placeholder={formatSpotPrice(lastPrice)}
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
            value={total > 0 ? formatSpotTotal(total) : ""}
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
        onClick={handleSubmit}
      >
        {isConnected ? placeLabel : t("spot.connectToTrade")}
      </Button>

      <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
        {t("spot.phase2Notice")}
      </p>
      <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
        <Link href="/swap">{t("spot.goSwap")}</Link>
      </Button>
    </section>
  );
}
