"use client";

import { useApiQuery } from "@/lib/api/hooks";
import {
  getKlineCurrentDay,
  getMarketOrderBook,
  listKlines,
  listMarketTrades,
  listMarketUserPairs,
  paginationMarketPairs,
} from "@/services/spot/market/api";
import type {
  KlineListReq,
  KlineListRsp,
  MarketKlineRsp,
  MarketOrderBookListRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
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

/** POST /market/store/pairs/user-pairs — market quotes for a user's pair ids. */
export function useMarketUserPairs(
  pairIds: number[] | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};
  const ids = pairIds ?? [];

  return useApiQuery<MarketPairsRsp>({
    queryKey: ["spot", "market", "pairs", "user-pairs", ids],
    queryFn: () => listMarketUserPairs({ pairIds: ids }),
    enabled: enabled && ids.length > 0,
    notifyError,
    staleTime: 15_000,
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

/** POST /market/store/kline/list — chart first screen or paginated history. */
export function useKlineList(
  req: KlineListReq | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<KlineListRsp>({
    queryKey: [
      "spot",
      "market",
      "kline",
      "list",
      req?.pairId,
      req?.interval,
      req?.limit,
      req?.beforeOpenTime,
    ],
    queryFn: () => listKlines(req!),
    enabled: enabled && req != null && req.pairId != null && req.interval.length > 0,
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
