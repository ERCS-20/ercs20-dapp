/** BigInteger fields from Java JSON (parsed via json-with-bigint). */
export type ApiBigInt = string | number | bigint;

export function apiBigIntToString(value: ApiBigInt): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return String(value);
  return value;
}

/** Coerce API BigInteger / uint256 to bigint for contract calls. */
export function parseApiBigInt(value: ApiBigInt | null | undefined): bigint | null {
  if (value == null) return null;
  if (typeof value === "bigint") return value;
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
