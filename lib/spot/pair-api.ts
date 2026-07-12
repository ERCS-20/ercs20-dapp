import type { PairRsp } from "@/services/spot/orders/types";
import type { SpotPair, SpotSide } from "@/lib/spot/types";
import { normalizePlaceOrderAmounts } from "@/lib/spot/order-place-amounts";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";

/** Parse orders/market pair code `BASE_QUOTE`. */
export function parsePairCode(code: string): { base: string; quote: string } | null {
  const trimmed = code.trim();
  const idx = trimmed.indexOf("_");
  if (idx <= 0 || idx >= trimmed.length - 1) return null;
  return {
    base: trimmed.slice(0, idx),
    quote: trimmed.slice(idx + 1),
  };
}

export function pairLabelFromCode(code: string): string {
  const parsed = parsePairCode(code);
  return parsed ? `${parsed.base}/${parsed.quote}` : code;
}

export function pairPathFromSymbols(baseSymbol: string, quoteSymbol: string): string {
  return `${baseSymbol.toLowerCase()}/${quoteSymbol.toLowerCase()}`;
}

export function pairPathFromCode(code: string): string {
  const parsed = parsePairCode(code);
  if (!parsed) return code.toLowerCase();
  return pairPathFromSymbols(parsed.base, parsed.quote);
}

export function pairRspToSpotPair(pair: PairRsp): SpotPair {
  const parsed = parsePairCode(pair.pairCode);
  const baseSymbol = parsed?.base ?? pair.pairCode.split("_")[0] ?? "TOKEN";
  const quoteSymbol = parsed?.quote ?? "USDC";

  return {
    pairId: pair.id,
    enginePriceDecimal: pair.enginePriceDecimal,
    baseSymbol,
    baseName: baseSymbol,
    baseAddress: pair.baseTokenAddress.toLowerCase() as `0x${string}`,
    quoteSymbol,
    quoteAddress: pair.quoteTokenAddress.toLowerCase() as `0x${string}`,
    pairCode: `${baseSymbol}/${quoteSymbol}`,
    minTradeAmount: parseApiBigInt(pair.minTradeAmount) ?? undefined,
  };
}

/**
 * Quote-side total after base truncation + price realignment (see `normalizePlaceOrderAmounts`).
 */
export function orderQuoteAmountBaseUnits(
  quantity: string,
  price: string,
  enginePriceDecimal: number,
  side: SpotSide = "sell",
  quoteBudget?: bigint
): bigint | null {
  return (
    normalizePlaceOrderAmounts({
      side,
      price,
      enginePriceDecimal,
      quantity,
      quoteBudget,
    })?.quoteAmount ?? null
  );
}

export function pairPath(pair: SpotPair): string {
  return pairPathFromSymbols(pair.baseSymbol, pair.quoteSymbol);
}

export function pairLabel(pair: SpotPair): string {
  return pair.pairCode;
}
