import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import type { SpotMarketTrade } from "@/lib/spot/types";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketTrade, MarketTradeListRsp } from "@/services/spot/market/types";

const BASE_VOLUME_DECIMALS = 18;
const ORDER_SIDE_BUY = 1;

/**
 * Max trades kept in the React Query cache (and shown in the market-trades panel).
 * Newest first; older rows are dropped on WS merge — dense list + slice, not a ring.
 * (REST may still arrive as a small ring; after the first WS merge we densify.)
 */
export const MARKET_TRADES_MAX = 200;

/**
 * Walk ring buffer from {@link MarketTradeListRsp.reverseFromIndex} backwards
 * (newest first), wrapping at 0 → length-1 so a cursor mid-buffer still yields
 * the full filled ring (e.g. reverseFromIndex=1 with 16 slots → 16 rows).
 */
export function iterMarketTradesNewestFirst(rsp: MarketTradeListRsp): MarketTrade[] {
  const { trades, reverseFromIndex } = rsp;
  if (!trades?.length) return [];

  if (reverseFromIndex == null || !Number.isFinite(reverseFromIndex)) {
    return trades.filter((t): t is MarketTrade => t != null);
  }

  const len = trades.length;
  const start = ((Math.trunc(reverseFromIndex) % len) + len) % len;
  const out: MarketTrade[] = [];
  let idx = start;

  for (let n = 0; n < len; n++) {
    const row = trades[idx];
    if (row) out.push(row);
    idx -= 1;
    if (idx < 0) idx = len - 1;
  }

  return out;
}

export function marketTradesToSpotTrades(
  rsp: MarketTradeListRsp | undefined,
  enginePriceDecimal: number,
  limit = MARKET_TRADES_MAX
): SpotMarketTrade[] {
  if (!rsp) return [];

  return iterMarketTradesNewestFirst(rsp)
    .slice(0, limit)
    .map((row, i) => {
      const qtyBi = parseApiBigInt(row.quantity) ?? BigInt(0);
      return {
        id: `${row.tradeTime}-${row.side}-${i}`,
        price: enginePriceToNumber(row.price, enginePriceDecimal),
        quantity: Number(qtyBi) / 10 ** BASE_VOLUME_DECIMALS,
        isBuy: row.side === ORDER_SIDE_BUY,
        time: row.tradeTime,
      };
    });
}

/**
 * Merge a WS trade batch into a REST list snapshot using envelope `sequence`.
 * Batch is chronological (old→new); result is dense newest-first with
 * `reverseFromIndex: null` for {@link iterMarketTradesNewestFirst}.
 * Caps at {@link MARKET_TRADES_MAX} (drop oldest).
 * Returns `rsp` unchanged when `sequence <= rsp.sequence`.
 */
export function appendWsTradesToListRsp(
  rsp: MarketTradeListRsp,
  batch: MarketTrade[],
  sequence: number,
  limit = MARKET_TRADES_MAX
): MarketTradeListRsp {
  if (batch.length === 0 || sequence <= rsp.sequence) return rsp;

  const existing = iterMarketTradesNewestFirst(rsp);
  // Docs: array order append; example is old→new → reverse for newest-first head.
  const incoming = [...batch].reverse();
  const merged = [...incoming, ...existing].slice(0, limit);

  return { trades: merged, reverseFromIndex: null, sequence };
}
