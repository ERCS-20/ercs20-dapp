"use client";

import { SpotMarketTrades } from "@/components/spot/spot-market-trades";
import { SpotOrderBook } from "@/components/spot/spot-order-book";
import { SpotOrderForm } from "@/components/spot/spot-order-form";
import type {
  SpotMarketTrade,
  SpotOrder,
  SpotOrderBook as SpotOrderBookData,
  SpotPair,
  SpotSide,
} from "@/lib/spot/types";
import { cn } from "@/lib/utils";

export function SpotTradePanel({
  pair,
  book,
  trades,
  side,
  price,
  quantity,
  lastPrice,
  change24hPct,
  availableBase,
  availableQuote,
  onSideChange,
  onPriceChange,
  onQuantityChange,
  onLevelClick,
  onPlaceOrder,
  className,
}: {
  pair: SpotPair;
  book: SpotOrderBookData;
  trades: SpotMarketTrade[];
  side: SpotSide;
  price: string;
  quantity: string;
  lastPrice: number;
  change24hPct: number;
  availableBase: string;
  availableQuote: string;
  onSideChange: (s: SpotSide) => void;
  onPriceChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onLevelClick: (price: number, size: number) => void;
  onPlaceOrder: (order: Omit<SpotOrder, "id" | "createdAt" | "status">) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 gap-1">
        <div className="flex min-h-0 w-[45%] flex-col gap-1">
          <SpotOrderBook
            book={book}
            quoteSymbol={pair.quoteSymbol}
            lastPrice={lastPrice}
            change24hPct={change24hPct}
            onLevelClick={onLevelClick}
            className="shrink-0"
          />
          <SpotMarketTrades trades={trades} pair={pair} className="min-h-0 flex-1" />
        </div>
        <SpotOrderForm
          pair={pair}
          side={side}
          price={price}
          quantity={quantity}
          lastPrice={lastPrice}
          availableBase={availableBase}
          availableQuote={availableQuote}
          onSideChange={onSideChange}
          onPriceChange={onPriceChange}
          onQuantityChange={onQuantityChange}
          onPlaceOrder={onPlaceOrder}
          className="min-h-0 h-full w-[55%] overflow-y-auto"
        />
      </div>
    </div>
  );
}
