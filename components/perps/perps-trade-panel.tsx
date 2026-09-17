"use client";

import { PerpsMarketTrades } from "@/components/perps/perps-market-trades";
import { PerpsOrderBook } from "@/components/perps/perps-order-book";
import { PerpsOrderForm } from "@/components/perps/perps-order-form";
import type { PerpsPair, PerpsSide } from "@/lib/perps/types";
import { cn } from "@/lib/utils";

export function PerpsTradePanel({
  pair,
  pairId,
  enginePriceDecimal,
  side,
  price,
  quantity,
  lastPrice,
  change24hPct,
  onSideChange,
  onPriceChange,
  onQuantityChange,
  onLevelClick,
  onOrderPlaced,
  className,
}: {
  pair: PerpsPair;
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  side: PerpsSide;
  price: string;
  quantity: string;
  lastPrice: number;
  change24hPct: number;
  onSideChange: (s: PerpsSide) => void;
  onPriceChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onLevelClick: (price: number, size: number) => void;
  onOrderPlaced?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 gap-1">
        <div className="flex min-h-0 w-[45%] flex-col gap-1">
          <PerpsOrderBook
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            quoteSymbol={pair.quoteSymbol}
            lastPrice={lastPrice}
            change24hPct={change24hPct}
            onLevelClick={onLevelClick}
            className="shrink-0"
          />
          <PerpsMarketTrades
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            pair={pair}
            className="min-h-0 flex-1"
          />
        </div>
        <PerpsOrderForm
          pair={pair}
          side={side}
          price={price}
          quantity={quantity}
          lastPrice={lastPrice}
          onSideChange={onSideChange}
          onPriceChange={onPriceChange}
          onQuantityChange={onQuantityChange}
          onOrderPlaced={onOrderPlaced}
          className="min-h-0 h-full w-[55%] overflow-y-auto"
        />
      </div>
    </div>
  );
}
