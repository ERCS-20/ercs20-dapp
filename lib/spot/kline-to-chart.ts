import type {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";

import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import { utcSecondsToLocalChartTime } from "@/lib/utils/format/datetime";
import type { MarketKlineRsp } from "@/services/spot/market/types";

function baseVolumeToNumber(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw);
  if (bi == null) return 0;
  return Number(bi) / 10 ** 18;
}

/**
 * Map REST klines to chart series.
 * lightweight-charts requires strictly ascending unique `time` (seconds).
 */
export function marketKlinesToChartSeries(
  bars: MarketKlineRsp[],
  enginePriceDecimal: number,
  colors: { up: string; down: string }
): {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  line: LineData<UTCTimestamp>[];
} {
  const candles: CandlestickData<UTCTimestamp>[] = [];
  const volumes: HistogramData<UTCTimestamp>[] = [];
  const line: LineData<UTCTimestamp>[] = [];

  const sorted = [...bars].sort((a, b) => a.openTime - b.openTime);
  let prevTime: number | null = null;

  for (const bar of sorted) {
    // Data is UTC; shift so chart axis shows browser local time.
    const time = utcSecondsToLocalChartTime(
      Math.floor(bar.openTime / 1000)
    ) as UTCTimestamp;
    // Same second (duplicate openTime or ms→s collision): keep the later bar.
    if (prevTime === time) {
      candles.pop();
      volumes.pop();
      line.pop();
    }
    prevTime = time;

    const open = enginePriceToNumber(bar.open, enginePriceDecimal);
    const high = enginePriceToNumber(bar.high, enginePriceDecimal);
    const low = enginePriceToNumber(bar.low, enginePriceDecimal);
    const close = enginePriceToNumber(bar.close, enginePriceDecimal);
    const up = close >= open;

    candles.push({ time, open, high, low, close });
    line.push({ time, value: close });
    volumes.push({
      time,
      value: baseVolumeToNumber(bar.baseVolume),
      color: up ? colors.up : colors.down,
    });
  }

  return { candles, volumes, line };
}
