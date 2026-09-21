"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useApiQuery } from "@/lib/api/hooks";
import {
  applyTradesToDayStats,
  dayStatsFromKlineCurrentDay,
  EMPTY_TICKER_STATS,
  type PerpsTickerStats,
} from "@/lib/perps/market-ticker-stats";
import {
  applyPairPricesToPagination,
  applyPairPricesToUserPairs,
  isMarketWsPairPriceList,
} from "@/lib/perps/pairs-price-merge";
import { isMarketKlineBar, mergeWsKlineBar } from "@/lib/perps/kline-merge";
import {
  getKlineCurrentDay,
  getMarketOrderBook,
  listKlines,
  listMarketTrades,
  listMarketUserPairs,
  paginationMarketPairs,
} from "@/services/perps/market/api";
import type {
  KlineListReq,
  KlineListRsp,
  MarketKlineCurrentDayRsp,
  MarketBidsAndAsksRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
  MarketTrade,
  MarketTradeListRsp,
  MarketWsOrderBookDiff,
} from "@/services/perps/market/types";
import {
  acquireTradeWsBridge,
  marketTradesQueryKey,
  releaseTradeWsBridge,
  type TradeBatchListener,
} from "@/services/perps/market/trade-ws-bridge";
import { perpsMarketWs, type MarketWsMessageHandler } from "@/services/perps/market/ws";

export { marketTradesQueryKey } from "@/services/perps/market/trade-ws-bridge";

export function marketPairsPaginationQueryKeyPrefix() {
  return ["perps", "market", "pairs", "pagination"] as const;
}

export function marketPairsUserPairsQueryKeyPrefix() {
  return ["perps", "market", "pairs", "user-pairs"] as const;
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

  useEffect(() => {
    if (!enabled || !perpsMarketWs.isConfigured()) return;

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "pairs") return;
      if (!isMarketWsPairPriceList(msg.data)) return;

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

    const removeHandler = perpsMarketWs.addHandler(onMessage);
    perpsMarketWs.subscribe("pairs");

    return () => {
      removeHandler();
      perpsMarketWs.unsubscribe("pairs");
    };
  }, [enabled, queryClient]);
}

export function useKlineCurrentDay(
  pairId: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<MarketKlineCurrentDayRsp>({
    queryKey: ["perps", "market", "kline", "current-day", pairId],
    queryFn: () => getKlineCurrentDay({ pairId: pairId! }),
    enabled: enabled && pairId != null,
    notifyError,
    staleTime: 15_000,
  });
}

export function marketKlineListQueryKey(req: {
  pairId: number;
  interval: string;
  beforeOpenTime?: string;
}) {
  return [
    "perps",
    "market",
    "kline",
    "list",
    req.pairId,
    req.interval,
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
      "perps",
      "market",
      "kline",
      "list",
      req?.pairId,
      req?.interval,
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
 * Tail-only merge (`openTime` older ignored; equal overwrites only if sequence is newer).
 * Reconnect → REST refetch.
 */
export function useMarketKlineWs(
  pairId: number | undefined,
  interval: string | undefined,
  options?: {
    enabled?: boolean;
    beforeOpenTime?: string;
  }
) {
  const { enabled = true, beforeOpenTime } = options ?? {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      !enabled ||
      pairId == null ||
      !interval ||
      !perpsMarketWs.isConfigured()
    ) {
      return;
    }

    const queryKey = marketKlineListQueryKey({
      pairId,
      interval,
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

    const offMessage = perpsMarketWs.addHandler(onMessage);
    const offReconnect = perpsMarketWs.addReconnectHandler(onReconnect);
    perpsMarketWs.subscribe("kline", pairId, interval);

    return () => {
      offMessage();
      offReconnect();
      perpsMarketWs.unsubscribe("kline", pairId, interval);
    };
  }, [beforeOpenTime, enabled, interval, pairId, queryClient]);
}

export function marketOrderBookQueryKey(pairId: number) {
  return ["perps", "market", "order-book", pairId] as const;
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

function isOrderBookPush(data: unknown): data is MarketBidsAndAsksRsp {
  if (data == null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.sequence === "number" &&
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
    if (!enabled || pairId == null || !perpsMarketWs.isConfigured()) return;

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
  stats: PerpsTickerStats;
  /** Last applied WS trade sequence; when set, REST baseline must not wipe stats. */
  liveSequence: number | null;
  prevClose: MarketKlineCurrentDayRsp["prevClose"] | null;
};

export function marketTickerQueryKey(pairId: number) {
  return ["perps", "market", "ticker", pairId] as const;
}

/**
 * Today ticker: REST `current-day` baseline + WS trade increments.
 * State lives in React Query (not component useState) so updates always
 * propagate to PerpsToolbar and survive baseline refetch races.
 */
export function usePerpsTickerStats(
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
      : (["perps", "market", "ticker", "none"] as const);

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

  return useApiQuery<MarketBidsAndAsksRsp>({
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
    if (!enabled || pairId == null || !perpsMarketWs.isConfigured()) return;

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || msg.channel !== "orderbook") return;
      if (msg.pairId !== pairId) return;
      if (!isOrderBookPush(msg.data)) return;
      onDiffRef.current?.(msg.data.sequence, msg.data);
    };

    const onReconnect = () => {
      void queryClient.invalidateQueries({
        queryKey: marketOrderBookQueryKey(pairId),
      });
    };

    const offMessage = perpsMarketWs.addHandler(onMessage);
    const offReconnect = perpsMarketWs.addReconnectHandler(onReconnect);
    perpsMarketWs.subscribe("orderbook", pairId);

    return () => {
      offMessage();
      offReconnect();
      perpsMarketWs.unsubscribe("orderbook", pairId);
    };
  }, [enabled, pairId, queryClient]);
}
