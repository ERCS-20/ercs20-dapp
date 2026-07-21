import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import { calcOpenCloseChange, marketKlineToStats } from "@/lib/spot/market-stats";
import type { SpotMarketStats } from "@/lib/spot/types";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type {
  MarketKlineCurrentDayRsp,
  MarketTrade,
} from "@/services/spot/market/types";

const BASE_VOLUME_DECIMALS = 18;

export type SpotTickerStats = SpotMarketStats & {
  changeAmount: number;
};

export const EMPTY_TICKER_STATS: SpotTickerStats = {
  lastPrice: 0,
  change24hPct: 0,
  changeAmount: 0,
  high24h: 0,
  low24h: 0,
  volumeBase: 0,
  volume24h: 0,
};

/** REST `current-day` baseline (today D1 + change vs yesterday close). */
export function dayStatsFromKlineCurrentDay(
  kline: MarketKlineCurrentDayRsp,
  enginePriceDecimal: number
): SpotTickerStats | null {
  const current = kline.current;
  if (!current) return null;

  const barStats = marketKlineToStats(current, enginePriceDecimal);
  const { lastPrice, change24hPct, changeAmount } = calcOpenCloseChange(
    kline.prevClose,
    current.close,
    enginePriceDecimal
  );

  return {
    lastPrice,
    change24hPct,
    changeAmount,
    high24h: barStats.high24h,
    low24h: barStats.low24h,
    volumeBase: barStats.volumeBase,
    volume24h: barStats.volume24h,
  };
}

function changeFromPrevClose(
  prevClose: ApiBigInt,
  lastPrice: number,
  enginePriceDecimal: number
): Pick<SpotTickerStats, "change24hPct" | "changeAmount"> {
  const prev = enginePriceToNumber(prevClose, enginePriceDecimal);
  if (prev === 0) {
    return { change24hPct: 0, changeAmount: 0 };
  }
  const changeAmount = lastPrice - prev;
  const change24hPct = (changeAmount / prev) * 100;
  return { change24hPct, changeAmount };
}

/**
 * Apply WS trade batch on top of day stats (chronological old→new).
 * Does not re-sum ring buffer — only incremental pushes since REST baseline.
 */
export function applyTradesToDayStats(
  stats: SpotTickerStats,
  trades: MarketTrade[],
  prevClose: ApiBigInt,
  enginePriceDecimal: number
): SpotTickerStats {
  if (trades.length === 0) return stats;

  let { lastPrice, high24h, low24h, volumeBase, volume24h } = stats;

  for (const trade of trades) {
    const priceBi = parseApiBigInt(trade.price);
    const qtyBi = parseApiBigInt(trade.quantity);
    if (priceBi == null || qtyBi == null) continue;

    const price = enginePriceToNumber(trade.price, enginePriceDecimal);
    const qty = Number(qtyBi) / 10 ** BASE_VOLUME_DECIMALS;

    lastPrice = price;
    high24h = high24h === 0 ? price : Math.max(high24h, price);
    low24h = low24h === 0 ? price : Math.min(low24h, price);
    volumeBase += qty;
    volume24h +=
      Number(priceBi * qtyBi) / 10 ** (BASE_VOLUME_DECIMALS + enginePriceDecimal);
  }

  return {
    lastPrice,
    high24h,
    low24h,
    volumeBase,
    volume24h,
    ...changeFromPrevClose(prevClose, lastPrice, enginePriceDecimal),
  };
}
