import type { MarketKlineRsp } from "@/lib/market/dto";

/**
 * Merge a WS kline into the REST/cache bar list (tail-only).
 * - same `openTime` as last → overwrite only when `sequence` is newer
 * - newer → append (middle gaps filled on display)
 * - older → ignore
 */
export function mergeWsKlineBar(
  bars: MarketKlineRsp[],
  incoming: MarketKlineRsp
): MarketKlineRsp[] {
  if (bars.length === 0) return [incoming];

  const last = bars[bars.length - 1];
  if (incoming.openTime < last.openTime) return bars;

  if (incoming.openTime === last.openTime) {
    if (incoming.sequence <= last.sequence) return bars;
    const next = bars.slice();
    next[next.length - 1] = incoming;
    return next;
  }

  return [...bars, incoming];
}

export function isMarketKlineBar(data: unknown): data is MarketKlineRsp {
  if (data == null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.sequence === "number" &&
    typeof d.openTime === "number" &&
    typeof d.interval === "string" &&
    typeof d.tradeCount === "number" &&
    typeof d.closedBar === "boolean" &&
    d.open != null &&
    d.close != null &&
    d.high != null &&
    d.low != null &&
    d.baseVolume != null &&
    d.quoteVolume != null
  );
}
