import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import type { SpotMarketTrade } from "@/lib/spot/types";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketTrade, MarketTradeListRsp } from "@/services/spot/market/types";

const BASE_VOLUME_DECIMALS = 18;
const ORDER_SIDE_BUY = 1;

/** Walk ring buffer from {@link MarketTradeListRsp.reverseFromIndex} backwards (newest first). */
export function iterMarketTradesNewestFirst(rsp: MarketTradeListRsp): MarketTrade[] {
  const { trades, reverseFromIndex } = rsp;
  if (!trades?.length) return [];

  if (reverseFromIndex == null) {
    return trades.filter((t): t is MarketTrade => t != null);
  }

  const out: MarketTrade[] = [];
  const len = trades.length;
  let idx = reverseFromIndex;

  for (let n = 0; n < len; n++) {
    if (idx < 0 || idx >= len) break;
    const row = trades[idx];
    if (row) out.push(row);
    idx -= 1;
  }

  if (out.length === 0) {
    return trades.filter((t): t is MarketTrade => t != null);
  }

  return out;
}

export function marketTradesToSpotTrades(
  rsp: MarketTradeListRsp | undefined,
  enginePriceDecimal: number,
  limit = 50
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
