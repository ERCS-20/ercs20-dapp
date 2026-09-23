import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Minimal orders PairRsp fields used by UI pair mapping. */
export type PairRspLike = {
  id: number;
  pairCode: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  enginePriceDecimal: number;
  minTradeAmount: ApiBigInt;
};

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

export function pairPath(pair: {
  baseSymbol: string;
  quoteSymbol: string;
}): string {
  return pairPathFromSymbols(pair.baseSymbol, pair.quoteSymbol);
}

export function pairLabel(pair: { pairCode: string }): string {
  return pair.pairCode;
}
