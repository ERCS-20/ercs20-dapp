"use client";

import { SpotMarketTrades } from "@/components/spot/spot-market-trades";
import { SpotOrderBook } from "@/components/spot/spot-order-book";
import { SpotOrderForm } from "@/components/spot/spot-order-form";
import type { SpotPair, SpotSide } from "@/lib/spot/types";
import { cn } from "@/lib/utils";

export function SpotTradePanel({
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
  pair: SpotPair;
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  side: SpotSide;
  price: string;
  quantity: string;
  lastPrice: number;
  change24hPct: number;
  onSideChange: (s: SpotSide) => void;
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
          <SpotOrderBook
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            quoteSymbol={pair.quoteSymbol}
            lastPrice={lastPrice}
            change24hPct={change24hPct}
            onLevelClick={onLevelClick}
            className="shrink-0"
          />
          <SpotMarketTrades
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            pair={pair}
            className="min-h-0 flex-1"
          />
        </div>
        <SpotOrderForm
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
