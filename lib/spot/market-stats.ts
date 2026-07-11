import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";

import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";

import type { MarketKlineRsp } from "@/services/spot/market/types";
import type { SpotMarketStats } from "@/lib/spot/types";

/** Change stats from API open/close (matching-engine integer, ÷ 10^enginePriceDecimal). */
export function calcOpenCloseChange(
  open: ApiBigInt,
  close: ApiBigInt,
  enginePriceDecimal: number
): {
  lastPrice: number;
  change24hPct: number;
  changeAmount: number;
} {
  const openBi = parseApiBigInt(open);
  const closeBi = parseApiBigInt(close);
  if (openBi == null || closeBi == null || openBi === BigInt(0)) {
    return { lastPrice: 0, change24hPct: 0, changeAmount: 0 };
  }

  const openNum = enginePriceToNumber(open, enginePriceDecimal);
  const lastPrice = enginePriceToNumber(close, enginePriceDecimal);
  const changeAmount = lastPrice - openNum;
  const change24hPct = openNum === 0 ? 0 : (changeAmount / openNum) * 100;

  return { lastPrice, change24hPct, changeAmount };
}

function volumeToNumber(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw);
  if (bi == null) return 0;
  return Number(bi) / 10 ** 18;
}

export function marketKlineToStats(
  kline: MarketKlineRsp,
  enginePriceDecimal: number
): SpotMarketStats {
  const { lastPrice, change24hPct } = calcOpenCloseChange(
    kline.open,
    kline.close,
    enginePriceDecimal
  );

  return {
    lastPrice,
    change24hPct,
    high24h: enginePriceToNumber(kline.high, enginePriceDecimal),
    low24h: enginePriceToNumber(kline.low, enginePriceDecimal),
    volumeBase: volumeToNumber(kline.baseVolume),
    volume24h: volumeToNumber(kline.quoteVolume),
  };
}
