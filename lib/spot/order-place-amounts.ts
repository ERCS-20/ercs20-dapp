import { SPOT_ORDER_AMOUNT_DECIMALS } from "@/lib/config/spot-order";
import { debugPlaceOrder } from "@/lib/spot/place-order-debug";
import type { SpotSide } from "@/lib/spot/types";
import { parseUnits } from "viem";

export const ORDER_SIDE_BUY = 1;
export const ORDER_SIDE_SELL = 2;

const WAD = BigInt(10) ** BigInt(18);

function gcd(a: bigint, b: bigint): bigint {
  let x = a < BigInt(0) ? -a : a;
  let y = b < BigInt(0) ? -b : b;
  while (y !== BigInt(0)) {
    [x, y] = [y, x % y];
  }
  return x;
}

function enginePriceScale(enginePriceDecimal: number): bigint {
  if (enginePriceDecimal <= 0) return BigInt(1);
  return BigInt(10) ** BigInt(enginePriceDecimal);
}

/** Largest base ≤ `base` such that `(base × enginePrice) % scale == 0`. */
export function alignBaseToEnginePrice(
  base: bigint,
  enginePrice: bigint,
  scale: bigint
): bigint {
  if (base <= BigInt(0) || enginePrice <= BigInt(0) || scale <= BigInt(0)) return BigInt(0);
  const step = scale / gcd(enginePrice, scale);
  return (base / step) * step;
}

export function parseEnginePrice(
  price: string,
  enginePriceDecimal: number
): bigint | null {
  const trimmed = price.trim();
  if (!trimmed || enginePriceDecimal < 0) return null;
  try {
    const enginePrice = parseUnits(trimmed, enginePriceDecimal);
    return enginePrice > BigInt(0) ? enginePrice : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors OrdersService: `price18 = quote × 10^18 / base` must be exact.
 * @see exchange.orbix.spot.orders.service.OrdersService#placeOrder
 */
export function assertQuoteBaseDivisible(
  quoteAmount: bigint,
  baseAmount: bigint
): void {
  if (baseAmount <= BigInt(0)) throw new Error("AMOUNT_NOT_MATCH");
  if ((quoteAmount * WAD) % baseAmount !== BigInt(0)) {
    throw new Error("AMOUNT_NOT_MATCH");
  }
}

/** Also requires `price18` divisible by `10^(18 - enginePriceDecimal)`. */
export function assertEnginePriceFromQuoteBase(
  quoteAmount: bigint,
  baseAmount: bigint,
  enginePriceDecimal: number
): void {
  assertQuoteBaseDivisible(quoteAmount, baseAmount);

  const price18 = (quoteAmount * WAD) / baseAmount;
  const scaleExp = 18 - enginePriceDecimal;
  if (scaleExp < 0) throw new Error("AMOUNT_NOT_MATCH");

  const scaleDivisor = scaleExp === 0 ? BigInt(1) : BigInt(10) ** BigInt(scaleExp);
  if (price18 % scaleDivisor !== BigInt(0)) {
    throw new Error("AMOUNT_NOT_MATCH");
  }
}

/** @deprecated Use {@link assertQuoteBaseDivisible} with quote/base amounts. */
export function assertPlaceOrderAmountsMatch(
  side: SpotSide,
  makerAmount: bigint,
  takerAmount: bigint,
  enginePriceDecimal: number
): void {
  const quoteAmount = side === "buy" ? makerAmount : takerAmount;
  const baseAmount = side === "buy" ? takerAmount : makerAmount;
  assertEnginePriceFromQuoteBase(quoteAmount, baseAmount, enginePriceDecimal);
}

export type NormalizedPlaceOrderAmounts = {
  baseAmount: bigint;
  quoteAmount: bigint;
  enginePrice: bigint;
};

/**
 * Normalize maker/taker amounts before place-order EIP-712 sign.
 *
 * 1. Derive truncated base (from quantity, or buy-side `quoteBudget / price`)
 * 2. Align base to engine price granularity
 * 3. Recompute quote = base × enginePrice ÷ 10^enginePriceDecimal
 */
export function normalizePlaceOrderAmounts(params: {
  side: SpotSide;
  price: string;
  enginePriceDecimal: number;
  quantity?: string;
  /** Buy: spend at most this quote budget; base = floor(quote × scale / enginePrice). */
  quoteBudget?: bigint;
}): NormalizedPlaceOrderAmounts | null {
  const enginePrice = parseEnginePrice(params.price, params.enginePriceDecimal);
  if (enginePrice == null) {
    debugPlaceOrder("normalize:fail", {
      reason: "parseEnginePrice",
      price: params.price,
      enginePriceDecimal: params.enginePriceDecimal,
    });
    return null;
  }

  const scale = enginePriceScale(params.enginePriceDecimal);

  let base: bigint;
  if (params.side === "buy" && params.quoteBudget != null && params.quoteBudget > BigInt(0)) {
    base = (params.quoteBudget * scale) / enginePrice;
  } else {
    const quantity = params.quantity?.trim();
    if (!quantity) return null;
    try {
      base = parseUnits(quantity, SPOT_ORDER_AMOUNT_DECIMALS);
    } catch (error) {
      debugPlaceOrder("normalize:fail", { reason: "parseUnits quantity", quantity, error });
      return null;
    }
  }

  base = alignBaseToEnginePrice(base, enginePrice, scale);
  if (base <= BigInt(0)) {
    debugPlaceOrder("normalize:fail", { reason: "base<=0", base: base.toString() });
    return null;
  }

  const quote = (base * enginePrice) / scale;
  if (quote <= BigInt(0)) {
    debugPlaceOrder("normalize:fail", {
      reason: "quote<=0",
      base: base.toString(),
      quote: quote.toString(),
    });
    return null;
  }

  try {
    assertEnginePriceFromQuoteBase(quote, base, params.enginePriceDecimal);
  } catch (error) {
    debugPlaceOrder("normalize:fail", {
      reason: "assertEnginePriceFromQuoteBase",
      base: base.toString(),
      quote: quote.toString(),
      error,
    });
    return null;
  }

  return { baseAmount: base, quoteAmount: quote, enginePrice };
}
