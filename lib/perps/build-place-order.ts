import {
  defaultSpotOrderExpiry,
  SPOT_ORDER_TIME_IN_FORCE_GTC,
} from "@/lib/config/spot-order";
import {
  normalizePlaceOrderAmounts,
  ORDER_SIDE_BUY,
  ORDER_SIDE_SELL,
} from "@/lib/market/order-place-amounts";
import {
  clampPerpsLeverage,
  marginFromNotional,
  PERPS_LEVERAGE_DEFAULT,
} from "@/lib/perps/leverage";
import type { PerpsSide } from "@/lib/perps/types";

/**
 * Fields for perps place-order HTTP + EIP-712 `Order`.
 * @see exchange.orbix.perps.orders.dto.PlaceOrderReq
 */
export type PlaceOrderFields = {
  pairId: number;
  maker: `0x${string}`;
  amount: bigint;
  margin: bigint;
  priceX18: bigint;
  side: number;
  timeInForce: number;
  expiry: bigint;
  salt: bigint;
  leverage: number;
};

/** `priceX18 = enginePrice × 10^(18 − enginePriceDecimal)`. */
export function enginePriceToPriceX18(
  enginePrice: bigint,
  enginePriceDecimal: number
): bigint {
  const scaleExp = 18 - enginePriceDecimal;
  if (scaleExp < 0) {
    throw new Error("Invalid enginePriceDecimal");
  }
  if (scaleExp === 0) return enginePrice;
  return enginePrice * BigInt(10) ** BigInt(scaleExp);
}

/**
 * Build place-order payload.
 * Isolated: `margin = floor(quoteNotional / leverage)` (default leverage 5×).
 * EIP-712 `nonce` = `salt`; `isBuy` = side === buy.
 */
export function buildPlaceOrderFields(params: {
  pairId: number;
  side: PerpsSide;
  price: string;
  quantity: string;
  enginePriceDecimal: number;
  maker: `0x${string}`;
  salt: bigint;
  expiry?: bigint;
  /** Buy: derive base from quote budget then recalc quote. */
  quoteBudget?: bigint;
  /** Isolated leverage; ignored when `margin` is set. */
  leverage?: number;
  /** Override margin (skips leverage math). */
  margin?: bigint;
}): PlaceOrderFields {
  const normalized = normalizePlaceOrderAmounts({
    side: params.side,
    price: params.price,
    enginePriceDecimal: params.enginePriceDecimal,
    quantity: params.quantity,
    quoteBudget: params.quoteBudget,
    product: "perps",
  });
  if (normalized == null) {
    throw new Error("Invalid price or quantity");
  }

  const leverage = clampPerpsLeverage(params.leverage ?? PERPS_LEVERAGE_DEFAULT);
  const { baseAmount, quoteAmount, enginePrice } = normalized;
  const priceX18 = enginePriceToPriceX18(enginePrice, params.enginePriceDecimal);

  let margin = params.margin;
  if (margin == null) {
    margin = marginFromNotional(quoteAmount, leverage) ?? undefined;
  }
  if (margin == null || margin <= BigInt(0)) {
    throw new Error("Invalid margin");
  }

  return {
    pairId: params.pairId,
    maker: params.maker,
    amount: baseAmount,
    margin,
    priceX18,
    side: params.side === "buy" ? ORDER_SIDE_BUY : ORDER_SIDE_SELL,
    timeInForce: SPOT_ORDER_TIME_IN_FORCE_GTC,
    expiry: params.expiry ?? defaultSpotOrderExpiry(),
    salt: params.salt,
    leverage,
  };
}
