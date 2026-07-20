import type { ChartInterval } from "@/lib/spot/chart-interval";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketKlineRsp } from "@/services/spot/market/types";

/** Cap synthetic bars so a huge idle gap cannot freeze the chart. */
const MAX_FILLED_BARS = 20_000;

/**
 * Next bucket openTime (UTC ms), matching backend `KlineBucketAligner.nextOpenTime`.
 */
export function nextKlineOpenTimeMs(
  interval: ChartInterval,
  openTimeMs: number
): number {
  switch (interval) {
    case "1s":
      return openTimeMs + 1_000;
    case "1m":
      return openTimeMs + 60_000;
    case "5m":
      return openTimeMs + 5 * 60_000;
    case "15m":
      return openTimeMs + 15 * 60_000;
    case "30m":
      return openTimeMs + 30 * 60_000;
    case "1h":
      return openTimeMs + 60 * 60_000;
    case "2h":
      return openTimeMs + 2 * 60 * 60_000;
    case "1d": {
      const d = new Date(openTimeMs);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
    }
    case "1w":
      return openTimeMs + 7 * 24 * 60 * 60_000;
    case "1M": {
      const d = new Date(openTimeMs);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    }
    case "1y": {
      const d = new Date(openTimeMs);
      return Date.UTC(d.getUTCFullYear() + 1, 0, 1);
    }
  }
}

/**
 * Bucket openTime containing `timeMs` (UTC), matching `KlineBucketAligner.alignOpenTime`.
 */
export function alignKlineOpenTimeMs(
  interval: ChartInterval,
  timeMs: number
): number {
  switch (interval) {
    case "1s":
      return Math.floor(timeMs / 1_000) * 1_000;
    case "1m":
      return Math.floor(timeMs / 60_000) * 60_000;
    case "5m":
      return Math.floor(timeMs / (5 * 60_000)) * (5 * 60_000);
    case "15m":
      return Math.floor(timeMs / (15 * 60_000)) * (15 * 60_000);
    case "30m":
      return Math.floor(timeMs / (30 * 60_000)) * (30 * 60_000);
    case "1h":
      return Math.floor(timeMs / (60 * 60_000)) * (60 * 60_000);
    case "2h":
      return Math.floor(timeMs / (2 * 60 * 60_000)) * (2 * 60 * 60_000);
    case "1d": {
      const d = new Date(timeMs);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    case "1w": {
      const d = new Date(timeMs);
      const day = d.getUTCDay(); // 0 Sun … 6 Sat
      const daysFromMonday = (day + 6) % 7;
      return Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate() - daysFromMonday
      );
    }
    case "1M": {
      const d = new Date(timeMs);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    }
    case "1y": {
      const d = new Date(timeMs);
      return Date.UTC(d.getUTCFullYear(), 0, 1);
    }
  }
}

/** Ms until the next bucket boundary after `nowMs` (at least 1). */
export function msUntilNextKlineBucket(
  interval: ChartInterval,
  nowMs: number = Date.now()
): number {
  const open = alignKlineOpenTimeMs(interval, nowMs);
  const next = nextKlineOpenTimeMs(interval, open);
  return Math.max(next - nowMs, 1);
}

function syntheticFlatBar(
  interval: ChartInterval,
  openTime: number,
  close: ApiBigInt,
  closedBar: boolean
): MarketKlineRsp {
  return {
    interval,
    openTime,
    open: close,
    high: close,
    low: close,
    close,
    baseVolume: 0,
    quoteVolume: 0,
    tradeCount: 0,
    closedBar,
  };
}

/**
 * Sparse REST klines → dense series with forward-filled empty buckets.
 * Between real bars: OHLC = previous real close, volumes/tradeCount = 0.
 * `prevClose` seeds gaps before the first bar when `fillFromOpenTimeMs` is set
 * (pagination); first-screen calls omit it and only fill between bars.
 */
export function fillSparseKlineGaps(
  bars: MarketKlineRsp[],
  interval: ChartInterval,
  options?: {
    prevClose?: ApiBigInt | null;
    /** Inclusive start of fill range before the first real bar (UTC ms). */
    fillFromOpenTimeMs?: number;
  }
): MarketKlineRsp[] {
  if (bars.length === 0) return [];

  const sorted = [...bars].sort((a, b) => a.openTime - b.openTime);
  const out: MarketKlineRsp[] = [];
  const prevClose = options?.prevClose;
  const fillFrom = options?.fillFromOpenTimeMs;

  if (fillFrom != null && prevClose != null && fillFrom < sorted[0].openTime) {
    let t = fillFrom;
    while (t < sorted[0].openTime && out.length < MAX_FILLED_BARS) {
      out.push(syntheticFlatBar(interval, t, prevClose, true));
      t = nextKlineOpenTimeMs(interval, t);
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const bar = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      let t = nextKlineOpenTimeMs(interval, prev.openTime);
      while (t < bar.openTime && out.length < MAX_FILLED_BARS) {
        out.push(syntheticFlatBar(interval, t, prev.close, true));
        t = nextKlineOpenTimeMs(interval, t);
      }
    }
    if (out.length >= MAX_FILLED_BARS && i < sorted.length - 1) {
      // Keep remaining real bars so the latest candle is still visible.
      out.push(...sorted.slice(i));
      break;
    }
    out.push(bar);
  }

  return out;
}

/**
 * After densify: append flat bars from after the last bar through the current
 * bucket (inclusive). No grace — WS may overwrite the tail immediately.
 */
export function fillKlineGapsToNow(
  densifiedBars: MarketKlineRsp[],
  interval: ChartInterval,
  nowMs: number = Date.now()
): MarketKlineRsp[] {
  if (densifiedBars.length === 0) return densifiedBars;

  const currentOpen = alignKlineOpenTimeMs(interval, nowMs);
  const last = densifiedBars[densifiedBars.length - 1];
  if (last.openTime >= currentOpen) return densifiedBars;

  const out = densifiedBars.slice();
  let t = nextKlineOpenTimeMs(interval, last.openTime);
  while (t <= currentOpen && out.length < MAX_FILLED_BARS) {
    const prevClose = out[out.length - 1].close;
    const closedBar = nextKlineOpenTimeMs(interval, t) <= nowMs;
    out.push(syntheticFlatBar(interval, t, prevClose, closedBar));
    t = nextKlineOpenTimeMs(interval, t);
  }
  return out;
}
