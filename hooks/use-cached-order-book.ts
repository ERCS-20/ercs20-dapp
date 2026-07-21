"use client";

import { useEffect, useRef, useState } from "react";

import {
  ORDER_BOOK_DISPLAY_DEPTH,
  OrderBookCache,
} from "@/lib/spot/order-book-cache";
import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import type { OrderBookLevel } from "@/lib/spot/types";
import {
  useMarketOrderBook,
  useMarketOrderBookWs,
} from "@/services/spot/market/hooks";

const BASE_VOLUME_DECIMALS = 18;

function levelsToDisplay(
  rows: { price: number; quantity: bigint }[],
  enginePriceDecimal: number
): OrderBookLevel[] {
  return rows.map(({ price, quantity }) => ({
    price: enginePriceToNumber(price, enginePriceDecimal),
    size: Number(quantity) / 10 ** BASE_VOLUME_DECIMALS,
  }));
}

function readDisplayLevels(
  cache: OrderBookCache,
  enginePriceDecimal: number,
  depth: number
) {
  return {
    bids: levelsToDisplay(cache.bids.top(depth), enginePriceDecimal),
    asks: levelsToDisplay(cache.asks.displayTop(depth), enginePriceDecimal),
  };
}

export function useCachedOrderBook(
  pairId: number | undefined,
  enginePriceDecimal: number | undefined,
  depth = ORDER_BOOK_DISPLAY_DEPTH
) {
  const cacheRef = useRef(new OrderBookCache());
  const [levels, setLevels] = useState<{
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  }>({ bids: [], asks: [] });

  const { data, isLoading, isSuccess } = useMarketOrderBook(pairId);

  useEffect(() => {
    cacheRef.current = new OrderBookCache();
    setLevels({ bids: [], asks: [] });
  }, [pairId]);

  useEffect(() => {
    if (!data || enginePriceDecimal == null) return;
    const cache = cacheRef.current;
    cache.applySnapshot(data);
    setLevels(readDisplayLevels(cache, enginePriceDecimal, depth));
  }, [data, depth, enginePriceDecimal]);

  useMarketOrderBookWs(pairId, {
    enabled: isSuccess && enginePriceDecimal != null,
    onDiff: (sequence, diff) => {
      if (enginePriceDecimal == null) return;
      const cache = cacheRef.current;
      if (!cache.applyDiff(sequence, diff)) return;
      setLevels(readDisplayLevels(cache, enginePriceDecimal, depth));
    },
  });

  const empty = levels.bids.length === 0 && levels.asks.length === 0;

  return {
    bids: levels.bids,
    asks: levels.asks,
    isLoading: isLoading && empty,
  };
}
