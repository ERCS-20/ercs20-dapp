"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useApiQuery } from "@/lib/api/hooks";
import { appendWsTradesToListRsp } from "@/lib/spot/market-trades-parse";
import { isMarketKlineBar, mergeWsKlineBar } from "@/lib/spot/kline-merge";
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
  MarketKlineCurrentDayRsp,
  MarketOrderBookListRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
  MarketTrade,
  MarketTradeListRsp,
  MarketWsOrderBookDiff,
} from "@/services/spot/market/types";
import { spotMarketWs, type MarketWsMessageHandler } from "@/services/spot/market/ws";

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

  return useApiQuery<MarketKlineCurrentDayRsp>({
    queryKey: ["spot", "market", "kline", "current-day", pairId],
    queryFn: () => getKlineCurrentDay({ pairId: pairId! }),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: 15_000,
  });
}

export function marketKlineListQueryKey(req: {
  pairId: number;
  interval: string;
  limit?: number;
  beforeOpenTime?: string;
}) {
  return [
    "spot",
    "market",
    "kline",
    "list",
    req.pairId,
    req.interval,
    req.limit,
    req.beforeOpenTime,
  ] as const;
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
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}

/**
 * After REST kline list: subscribe `kline` WS for `interval`.
 * Tail-only merge (`openTime` ≤ last ignored; equal overwrite; newer append).
 * Reconnect → REST refetch.
 */
export function useMarketKlineWs(
  pairId: number | undefined,
  interval: string | undefined,
  options?: {
    enabled?: boolean;
    limit?: number;
    beforeOpenTime?: string;
  }
) {
  const { enabled = true, limit, beforeOpenTime } = options ?? {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      !enabled ||
      pairId == null ||
      !interval ||
      !spotMarketWs.isConfigured()
    ) {
      return;
    }

    const queryKey = marketKlineListQueryKey({
      pairId,
      interval,
      limit,
      beforeOpenTime,
    });

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "kline") return;
      if (msg.pairId !== pairId) return;
      if (!isMarketKlineBar(msg.data)) return;
      if (msg.data.interval !== interval) return;
      const bar = msg.data;

      queryClient.setQueryData<KlineListRsp>(queryKey, (prev) => {
        if (!prev) return prev;
        return { ...prev, bars: mergeWsKlineBar(prev.bars, bar) };
      });
    };

    const onReconnect = () => {
      void queryClient.invalidateQueries({ queryKey });
    };

    const offMessage = spotMarketWs.addHandler(onMessage);
    const offReconnect = spotMarketWs.addReconnectHandler(onReconnect);
    spotMarketWs.subscribe("kline", pairId, interval);

    return () => {
      offMessage();
      offReconnect();
      spotMarketWs.unsubscribe("kline", pairId, interval);
    };
  }, [beforeOpenTime, enabled, interval, limit, pairId, queryClient]);
}

export function marketTradesQueryKey(pairId: number) {
  return ["spot", "market", "trades", pairId] as const;
}

export function marketOrderBookQueryKey(pairId: number) {
  return ["spot", "market", "order-book", pairId] as const;
}

export function useMarketTrades(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketTradeListRsp>({
    queryKey: marketTradesQueryKey(pairId!),
    queryFn: () => listMarketTrades(pairId!),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}

function isTradeBatch(data: unknown): data is MarketTrade[] {
  return Array.isArray(data);
}

function isOrderBookDiff(data: unknown): data is MarketWsOrderBookDiff {
  if (data == null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    (d.bids == null || Array.isArray(d.bids)) &&
    (d.asks == null || Array.isArray(d.asks))
  );
}

/**
 * After REST trades snapshot: subscribe `trade` WS and prepend batches into the
 * React Query cache. Dedup via REST/WS shared `sequence`. On reconnect, refetch REST.
 */
export function useMarketTradesWs(
  pairId: number | undefined,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || pairId == null || !spotMarketWs.isConfigured()) return;

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "trade") return;
      if (msg.pairId !== pairId) return;
      if (!isTradeBatch(msg.data) || msg.data.length === 0) return;
      if (typeof msg.sequence !== "number") return;
      const batch = msg.data;
      const sequence = msg.sequence;

      queryClient.setQueryData<MarketTradeListRsp>(
        marketTradesQueryKey(pairId),
        (prev) => {
          if (!prev) return prev;
          return appendWsTradesToListRsp(prev, batch, sequence);
        }
      );
    };

    const onReconnect = () => {
      void queryClient.invalidateQueries({
        queryKey: marketTradesQueryKey(pairId),
      });
    };

    const offMessage = spotMarketWs.addHandler(onMessage);
    const offReconnect = spotMarketWs.addReconnectHandler(onReconnect);
    spotMarketWs.subscribe("trade", pairId);

    return () => {
      offMessage();
      offReconnect();
      spotMarketWs.unsubscribe("trade", pairId);
    };
  }, [enabled, pairId, queryClient]);
}

export function useMarketOrderBook(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketOrderBookListRsp>({
    queryKey: marketOrderBookQueryKey(pairId!),
    queryFn: () => getMarketOrderBook(pairId!),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}

/**
 * After REST order-book snapshot: subscribe `orderbook` WS diffs.
 * `onDiff` applies absolute qty patches (`0` = delete). Reconnect → REST refetch.
 */
export function useMarketOrderBookWs(
  pairId: number | undefined,
  options?: {
    enabled?: boolean;
    onDiff?: (sequence: number, data: MarketWsOrderBookDiff) => void;
  }
) {
  const { enabled = true, onDiff } = options ?? {};
  const queryClient = useQueryClient();
  const onDiffRef = useRef(onDiff);
  onDiffRef.current = onDiff;

  useEffect(() => {
    if (!enabled || pairId == null || !spotMarketWs.isConfigured()) return;

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "orderbook") return;
      if (msg.pairId !== pairId) return;
      if (typeof msg.sequence !== "number") return;
      if (!isOrderBookDiff(msg.data)) return;
      onDiffRef.current?.(msg.sequence, msg.data);
    };

    const onReconnect = () => {
      void queryClient.invalidateQueries({
        queryKey: marketOrderBookQueryKey(pairId),
      });
    };

    const offMessage = spotMarketWs.addHandler(onMessage);
    const offReconnect = spotMarketWs.addReconnectHandler(onReconnect);
    spotMarketWs.subscribe("orderbook", pairId);

    return () => {
      offMessage();
      offReconnect();
      spotMarketWs.unsubscribe("orderbook", pairId);
    };
  }, [enabled, pairId, queryClient]);
}
