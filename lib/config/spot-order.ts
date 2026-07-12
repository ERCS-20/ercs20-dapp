/** Spot order defaults — align with spot-orders `application.yml` / Java constants. */

import { getDefaultDecimals } from "@/lib/config/public-env";

function readIntEnv(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Mirrors `exchange.orbix.spot.components.constants.TimeInForce.GTC`. */
export const SPOT_ORDER_TIME_IN_FORCE_GTC = readIntEnv(
  "NEXT_PUBLIC_ORDER_TIME_IN_FORCE_GT",
  1
);

/**
 * GTC order expiry horizon in days (UTC epoch seconds).
 * Backend validates `expiry >= now + spot.orders.order-expiry-gtc-min-days` (default 30).
 */
export const SPOT_ORDER_GTC_EXPIRY_DAYS = readIntEnv(
  "NEXT_PUBLIC_SPOT_ORDER_GTC_EXPIRY_DAYS",
  31
);

/** Base/quote token amount decimals for matching-engine orders. */
export const SPOT_ORDER_AMOUNT_DECIMALS = getDefaultDecimals();

export function defaultSpotOrderExpiry(): bigint {
  const days = SPOT_ORDER_GTC_EXPIRY_DAYS > 0 ? SPOT_ORDER_GTC_EXPIRY_DAYS : 31;
  return BigInt(Math.floor(Date.now() / 1000) + days * 86_400);
}
