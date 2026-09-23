import { parseApiBigInt } from "@/lib/utils/coerce-bigint";

import type { PairRspLike } from "@/lib/market/pair";
import { parsePairCode } from "@/lib/market/pair";
import type { OrderSide, TradingPair } from "@/lib/market/types";
import { normalizePlaceOrderAmounts } from "@/lib/market/order-place-amounts";

export function pairRspToTradingPair(pair: PairRspLike): TradingPair {
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
  side: OrderSide = "sell",
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
