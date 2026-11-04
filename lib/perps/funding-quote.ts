import { parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketFundingRateRsp } from "@/services/perps/market/types";

const HOUR_SECONDS = BigInt(3600);
const PERCENT_SCALE = BigInt(10000);
const RATE_SCALE = BigInt(10) ** BigInt(18);
/** `ratePerSecondX18 * 3600 * 100 * 10000 / 1e18` → hourly percent with 4 decimal places. */
const HOURLY_PERCENT_NUMER = BigInt("3600000000");

/** Seconds left in the 1h funding window. `timestamp` is Unix seconds. */
export function fundingCountdownSeconds(timestampSec: bigint, nowMs: number): number {
  const nowSec = BigInt(Math.floor(nowMs / 1000));
  const remaining = HOUR_SECONDS - (nowSec - timestampSec);
  if (remaining <= BigInt(0)) return 0;
  const seconds = Number(remaining);
  return Number.isFinite(seconds) ? seconds : 0;
}

export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/** Hourly funding percent from `ratePerSecondX18`, signed by `positive`. */
export function formatHourlyFundingPercent(positive: boolean, ratePerSecondX18: ApiBigInt): string | null {
  const rate = parseApiBigInt(ratePerSecondX18);
  if (rate == null || rate < BigInt(0)) return null;
  const units = (rate * HOURLY_PERCENT_NUMER + RATE_SCALE / BigInt(2)) / RATE_SCALE;
  const whole = units / PERCENT_SCALE;
  const frac = (units % PERCENT_SCALE).toString().padStart(4, "0");
  return `${positive ? "+" : "-"}${whole.toString()}.${frac}%`;
}

/** `+0.0100% / 00:42:03`. Returns null when the payload cannot be shown. */
export function formatFundingQuote(rate: MarketFundingRateRsp, nowMs: number): string | null {
  const percent = formatHourlyFundingPercent(rate.positive, rate.ratePerSecondX18);
  const timestamp = parseApiBigInt(rate.timestamp);
  if (percent == null || timestamp == null) return null;
  return `${percent} / ${formatCountdown(fundingCountdownSeconds(timestamp, nowMs))}`;
}
