import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";

/** Convert matching-engine integer price → human quote price (÷ 10^enginePriceDecimal). */
export function enginePriceToNumber(
  raw: ApiBigInt,
  enginePriceDecimal: number
): number {
  const bi = parseApiBigInt(raw);
  if (bi == null || enginePriceDecimal < 0) return 0;
  if (enginePriceDecimal === 0) return Number(bi);

  const divisor = 10 ** enginePriceDecimal;
  return Number(bi) / divisor;
}

/** Read `enginePriceDecimal` from orders `PairRsp` (camelCase or snake_case). */
export function resolveEnginePriceDecimal(value: unknown): number | undefined {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  if (Number.isFinite(n) && n >= 0) {
    return Math.trunc(n);
  }
  return undefined;
}
