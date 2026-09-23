"use client";

import {
  useMarketOrderBook,
  useMarketOrderBookWs,
} from "@/services/perps/market/hooks";
import { useCachedOrderBookWith } from "@/hooks/use-cached-order-book-core";
import { ORDER_BOOK_DISPLAY_DEPTH } from "@/lib/market/order-book-cache";

export function useCachedPerpsOrderBook(
  pairId: number | undefined,
  enginePriceDecimal: number | undefined,
  depth = ORDER_BOOK_DISPLAY_DEPTH
) {
  return useCachedOrderBookWith(
    { useMarketOrderBook, useMarketOrderBookWs },
    pairId,
    enginePriceDecimal,
    depth
  );
}
