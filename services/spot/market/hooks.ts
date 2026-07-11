"use client";

import { useApiQuery } from "@/lib/api/hooks";
import {
  getKlineCurrentDay,
  getMarketOrderBook,
  listMarketTrades,
  paginationMarketPairs,
} from "@/services/spot/market/api";
import type {
  MarketKlineRsp,
  MarketOrderBookListRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketTradeListRsp,
} from "@/services/spot/market/types";

export function useMarketPairsPagination(
  req: MarketPairsPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketPairsPaginationRsp>({
    queryKey: ["spot", "market", "pairs", "pagination", req],
    queryFn: () => paginationMarketPairs(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useKlineCurrentDay(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketKlineRsp>({
    queryKey: ["spot", "market", "kline", "current-day", pairId],
    queryFn: () => getKlineCurrentDay({ pairId: pairId! }),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: 15_000,
  });
}

export function useMarketTrades(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketTradeListRsp>({
    queryKey: ["spot", "market", "trades", pairId],
    queryFn: () => listMarketTrades(pairId!),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}

export function useMarketOrderBook(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketOrderBookListRsp>({
    queryKey: ["spot", "market", "order-book", pairId],
    queryFn: () => getMarketOrderBook(pairId!),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}
