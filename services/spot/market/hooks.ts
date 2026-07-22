"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useApiQuery } from "@/lib/api/hooks";
import {
  applyTradesToDayStats,
  dayStatsFromKlineCurrentDay,
  EMPTY_TICKER_STATS,
  type SpotTickerStats,
} from "@/lib/spot/market-ticker-stats";
import {
  applyPairPricesToPagination,
  applyPairPricesToUserPairs,
  isMarketWsPairPriceList,
} from "@/lib/spot/pairs-price-merge";
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
import {
  acquireTradeWsBridge,
  marketTradesQueryKey,
  releaseTradeWsBridge,
  type TradeBatchListener,
} from "@/services/spot/market/trade-ws-bridge";
import { spotMarketWs, type MarketWsMessageHandler } from "@/services/spot/market/ws";

export { marketTradesQueryKey } from "@/services/spot/market/trade-ws-bridge";

export function marketPairsPaginationQueryKeyPrefix() {
  return ["spot", "market", "pairs", "pagination"] as const;
}

export function marketPairsUserPairsQueryKeyPrefix() {
  return ["spot", "market", "pairs", "user-pairs"] as const;
}

export function useMarketPairsPagination(
  req: MarketPairsPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketPairsPaginationRsp>({
    queryKey: [...marketPairsPaginationQueryKeyPrefix(), req],
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
    queryKey: [...marketPairsUserPairsQueryKeyPrefix(), ids],
    queryFn: () => listMarketUserPairs({ pairIds: ids }),
    enabled: enabled && ids.length > 0,
    notifyError,
    staleTime: 15_000,
  });
}

/**
 * After REST pairs pagination: subscribe global `pairs` WS and patch
 * open/close into pagination + user-pairs React Query caches.
 */
export function useMarketPairsWs(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const queryClient = useQueryClient();
  const lastSequenceRef = useRef(-1);

  useEffect(() => {
    if (!enabled || !spotMarketWs.isConfigured()) return;

    lastSequenceRef.current = -1;

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "pairs") return;
      if (!isMarketWsPairPriceList(msg.data)) return;

      // sequence=-1: day-roll / add — always apply. Else drop stale batches.
      if (
        msg.sequence >= 0 &&
        lastSequenceRef.current >= 0 &&
        msg.sequence < lastSequenceRef.current
      ) {
        return;
      }
      if (msg.sequence >= 0) {
        lastSequenceRef.current = msg.sequence;
      }

      const updates = msg.data;
      queryClient.setQueriesData<MarketPairsPaginationRsp>(
        { queryKey: marketPairsPaginationQueryKeyPrefix() },
        (old) => applyPairPricesToPagination(old, updates)
      );
      queryClient.setQueriesData<MarketPairsRsp>(
        { queryKey: marketPairsUserPairsQueryKeyPrefix() },
        (old) => applyPairPricesToUserPairs(old, updates)
      );
    };

    const removeHandler = spotMarketWs.addHandler(onMessage);
    spotMarketWs.subscribe("pairs");

    return () => {
      removeHandler();
      spotMarketWs.unsubscribe("pairs");
    };
  }, [enabled, queryClient]);
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

function isOrderBookDiff(data: unknown): data is MarketWsOrderBookDiff {
  if (data == null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    (d.bids == null || Array.isArray(d.bids)) &&
    (d.asks == null || Array.isArray(d.asks))
  );
}

/**
 * Trade WS: single merge into React Query per pairId; optional `onBatch` listeners
 * for side effects (ticker). List UI just reads the query cache.
 */
export function useMarketTradesWs(
  pairId: number | undefined,
  options?: {
    enabled?: boolean;
    /** Called once after a successful merge (not on sequence-stale). */
    onBatch?: (batch: MarketTrade[], sequence: number) => void;
  }
) {
  const { enabled = true, onBatch } = options ?? {};
  const queryClient = useQueryClient();
  const onBatchRef = useRef(onBatch);
  onBatchRef.current = onBatch;

  useEffect(() => {
    if (!enabled || pairId == null || !spotMarketWs.isConfigured()) return;

    const bridge = acquireTradeWsBridge(pairId, queryClient);
    const listener: TradeBatchListener = (batch, sequence) => {
      onBatchRef.current?.(batch, sequence);
    };
    bridge.listeners.add(listener);

    return () => {
      bridge.listeners.delete(listener);
      releaseTradeWsBridge(pairId);
    };
  }, [enabled, pairId, queryClient]);
}

/**
 * Client-side ticker cache (REST day bar + WS trade increments).
 * Stored in React Query so toolbar always observes the same source as merges.
 */
export type MarketTickerCache = {
  stats: SpotTickerStats;
  /** Last applied WS trade sequence; when set, REST baseline must not wipe stats. */
  liveSequence: number | null;
  prevClose: MarketKlineCurrentDayRsp["prevClose"] | null;
};

export function marketTickerQueryKey(pairId: number) {
  return ["spot", "market", "ticker", pairId] as const;
}

/**
 * Today ticker: REST `current-day` baseline + WS trade increments.
 * State lives in React Query (not component useState) so updates always
 * propagate to SpotToolbar and survive baseline refetch races.
 */
export function useSpotTickerStats(
  pairId: number | undefined,
  enginePriceDecimal: number | undefined,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};
  const queryClient = useQueryClient();
  const pairEnabled = enabled && pairId != null && enginePriceDecimal != null;

  const { data: kline, isLoading: klineLoading } = useKlineCurrentDay(pairId, {
    enabled: pairEnabled,
  });
  const { isSuccess: tradesReady } = useMarketTrades(pairId, {
    enabled: pairEnabled,
  });

  const tickerKey =
    pairId != null
      ? marketTickerQueryKey(pairId)
      : (["spot", "market", "ticker", "none"] as const);

  // Observe ticker cache; seed/onBatch write via setQueryData (no HTTP).
  const { data: cache } = useQuery({
    queryKey: tickerKey,
    queryFn: (): MarketTickerCache =>
      queryClient.getQueryData<MarketTickerCache>(tickerKey) ?? {
        stats: EMPTY_TICKER_STATS,
        liveSequence: null,
        prevClose: null,
      },
    enabled: pairEnabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Seed / refresh REST baseline; never overwrite after a live WS sequence.
  useEffect(() => {
    if (!pairEnabled || pairId == null || !kline || enginePriceDecimal == null) {
      return;
    }

    queryClient.setQueryData<MarketTickerCache>(tickerKey, (prev) => {
      if (prev?.liveSequence != null) {
        return {
          ...prev,
          prevClose: kline.prevClose ?? prev.prevClose,
        };
      }
      const baseline = dayStatsFromKlineCurrentDay(kline, enginePriceDecimal);
      if (!baseline) return prev;
      return {
        stats: baseline,
        liveSequence: null,
        prevClose: kline.prevClose,
      };
    });
  }, [enginePriceDecimal, kline, pairEnabled, pairId, queryClient, tickerKey]);

  useMarketTradesWs(pairId, {
    enabled: pairEnabled && tradesReady,
    onBatch: (batch, sequence) => {
      if (pairId == null || enginePriceDecimal == null) return;

      queryClient.setQueryData<MarketTickerCache>(
        marketTickerQueryKey(pairId),
        (prev) => {
          if (prev?.liveSequence != null && sequence <= prev.liveSequence) {
            return prev;
          }

          const prevClose =
            prev?.prevClose ?? kline?.prevClose ?? batch[0]?.price ?? null;
          if (prevClose == null) return prev;

          const base =
            prev?.stats ??
            (kline
              ? dayStatsFromKlineCurrentDay(kline, enginePriceDecimal)
              : null) ??
            EMPTY_TICKER_STATS;

          return {
            stats: applyTradesToDayStats(
              base,
              batch,
              prevClose,
              enginePriceDecimal
            ),
            liveSequence: sequence,
            prevClose,
          };
        }
      );
    },
  });

  return {
    stats: cache?.stats ?? EMPTY_TICKER_STATS,
    isLoading: Boolean(pairEnabled && klineLoading && cache?.stats == null),
  };
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
