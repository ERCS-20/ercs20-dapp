import type { QueryClient } from "@tanstack/react-query";

import { appendWsTradesToListRsp } from "@/lib/spot/market-trades-parse";
import type { MarketTrade, MarketTradeListRsp } from "@/services/spot/market/types";
import {
  spotMarketWs,
  type MarketWsMessageHandler,
} from "@/services/spot/market/ws";

export type TradeBatchListener = (
  batch: MarketTrade[],
  sequence: number
) => void;

type PairTradeBridge = {
  pairId: number;
  queryClient: QueryClient;
  /** How many React hooks currently hold this bridge open. */
  refCount: number;
  /** Side effects after a successful merge (e.g. ticker). List UI uses RQ cache. */
  listeners: Set<TradeBatchListener>;
  offMessage: (() => void) | null;
  offReconnect: (() => void) | null;
};

/** One merge pipeline per pairId — shared across list + ticker hooks. */
const bridges = new Map<number, PairTradeBridge>();

export function marketTradesQueryKey(pairId: number) {
  return ["spot", "market", "trades", pairId] as const;
}

function isTradeBatch(data: unknown): data is MarketTrade[] {
  return Array.isArray(data);
}

function attachHandlers(bridge: PairTradeBridge): void {
  const { pairId, queryClient } = bridge;

  const onMessage: MarketWsMessageHandler = (msg) => {
    if (!("channel" in msg) || msg.channel !== "trade") return;
    if (msg.pairId !== pairId) return;
    if (!isTradeBatch(msg.data) || msg.data.length === 0) return;
    if (typeof msg.sequence !== "number") return;

    const batch = msg.data;
    const sequence = msg.sequence;

    let applied = false;
    queryClient.setQueryData<MarketTradeListRsp>(
      marketTradesQueryKey(pairId),
      (prev) => {
        if (!prev) return prev;
        const next = appendWsTradesToListRsp(prev, batch, sequence);
        if (next === prev) return prev;
        applied = true;
        return next;
      }
    );

    if (!applied) return;
    for (const listener of bridge.listeners) {
      listener(batch, sequence);
    }
  };

  const onReconnect = () => {
    void queryClient.invalidateQueries({
      queryKey: marketTradesQueryKey(pairId),
    });
  };

  bridge.offMessage = spotMarketWs.addHandler(onMessage);
  bridge.offReconnect = spotMarketWs.addReconnectHandler(onReconnect);
  spotMarketWs.subscribe("trade", pairId);
}

/**
 * Ref-counted: first holder opens WS + single merge handler; last releases.
 * Returns the bridge so callers can add/remove batch listeners.
 */
export function acquireTradeWsBridge(
  pairId: number,
  queryClient: QueryClient
): PairTradeBridge {
  const existing = bridges.get(pairId);
  if (existing) {
    existing.refCount += 1;
    return existing;
  }

  const bridge: PairTradeBridge = {
    pairId,
    queryClient,
    refCount: 1,
    listeners: new Set(),
    offMessage: null,
    offReconnect: null,
  };
  bridges.set(pairId, bridge);
  attachHandlers(bridge);
  return bridge;
}

export function releaseTradeWsBridge(pairId: number): void {
  const bridge = bridges.get(pairId);
  if (!bridge) return;

  bridge.refCount -= 1;
  if (bridge.refCount > 0) return;

  bridge.offMessage?.();
  bridge.offReconnect?.();
  bridge.listeners.clear();
  spotMarketWs.unsubscribe("trade", pairId);
  bridges.delete(pairId);
}
