import {
  defaultSpotOrderExpiry,
  SPOT_ORDER_TIME_IN_FORCE_GTC,
} from "@/lib/config/spot-order";
import { normalizePlaceOrderAmounts } from "@/lib/spot/order-place-amounts";
import type { SpotSide } from "@/lib/spot/types";

export type PlaceOrderFields = {
  pairId: number;
  maker: `0x${string}`;
  makerToken: `0x${string}`;
  takerToken: `0x${string}`;
  makerAmount: bigint;
  takerAmount: bigint;
  timeInForce: number;
  expiry: bigint;
  salt: bigint;
};

export function buildPlaceOrderFields(params: {
  pairId: number;
  side: SpotSide;
  price: string;
  quantity: string;
  enginePriceDecimal: number;
  baseTokenAddress: `0x${string}`;
  quoteTokenAddress: `0x${string}`;
  maker: `0x${string}`;
  salt: bigint;
  expiry?: bigint;
  /** Buy: derive base from quote budget (`floor(quote / price)`) then recalc quote. */
  quoteBudget?: bigint;
}): PlaceOrderFields {
  const normalized = normalizePlaceOrderAmounts({
    side: params.side,
    price: params.price,
    enginePriceDecimal: params.enginePriceDecimal,
    quantity: params.quantity,
    quoteBudget: params.quoteBudget,
  });
  if (normalized == null) {
    throw new Error("Invalid price or quantity");
  }

  const { baseAmount, quoteAmount } = normalized;
  const base = params.baseTokenAddress.toLowerCase() as `0x${string}`;
  const quote = params.quoteTokenAddress.toLowerCase() as `0x${string}`;
  const expiry = params.expiry ?? defaultSpotOrderExpiry();

  if (params.side === "buy") {
    return {
      pairId: params.pairId,
      maker: params.maker,
      makerToken: quote,
      takerToken: base,
      makerAmount: quoteAmount,
      takerAmount: baseAmount,
      timeInForce: SPOT_ORDER_TIME_IN_FORCE_GTC,
      expiry,
      salt: params.salt,
    };
  }

  return {
    pairId: params.pairId,
    maker: params.maker,
    makerToken: base,
    takerToken: quote,
    makerAmount: baseAmount,
    takerAmount: quoteAmount,
    timeInForce: SPOT_ORDER_TIME_IN_FORCE_GTC,
    expiry,
    salt: params.salt,
  };
}
