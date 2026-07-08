import type { ApiBigInt } from "@/services/spot/accounts/types";

/** Parse Java BigInteger / uint fields from spot API JSON (string or number). */
export function parseApiBigInt(value: ApiBigInt | null | undefined): bigint | null {
  if (value == null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return BigInt(Math.trunc(value));
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

export function apiBigIntToString(value: ApiBigInt): string {
  return typeof value === "number" ? String(value) : value;
}
