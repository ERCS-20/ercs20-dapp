import { getPerpsExchangeAddress } from "@/lib/config/perps-exchange";

/**
 * Align with `perps.contract.exchange.eip712` / `OrdersEIP712Signature`.
 * Typehash: `Order(address trader,uint256 marketId,uint256 amount,uint256 margin,uint256 priceX18,bool isBuy,uint256 nonce,uint256 expiry)`.
 */
export function getPlaceOrderEip712Domain(chainId: number) {
  const verifyingContract = getPerpsExchangeAddress();
  if (!verifyingContract) {
    throw new Error("Missing NEXT_PUBLIC_PERPS_EXCHANGE_ADDRESS");
  }

  return {
    name: process.env.NEXT_PUBLIC_PERPS_EIP712_EXCHANGE_NAME?.trim() || "PerpsExchange",
    version: process.env.NEXT_PUBLIC_PERPS_EIP712_EXCHANGE_VERSION?.trim() || "1",
    chainId,
    verifyingContract,
  } as const;
}

export const PLACE_ORDER_EIP712_TYPES = {
  Order: [
    { name: "trader", type: "address" },
    { name: "marketId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "margin", type: "uint256" },
    { name: "priceX18", type: "uint256" },
    { name: "isBuy", type: "bool" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
} as const;

export function getPlaceOrderSignTypedData(
  params: {
    trader: `0x${string}`;
    marketId: number | bigint;
    amount: bigint;
    margin: bigint;
    priceX18: bigint;
    isBuy: boolean;
    /** HTTP `salt` — signed as `nonce`. */
    nonce: bigint;
    expiry: bigint;
  },
  chainId: number
) {
  return {
    domain: getPlaceOrderEip712Domain(chainId),
    types: PLACE_ORDER_EIP712_TYPES,
    primaryType: "Order" as const,
    message: {
      trader: params.trader.toLowerCase() as `0x${string}`,
      marketId: BigInt(params.marketId),
      amount: params.amount,
      margin: params.margin,
      priceX18: params.priceX18,
      isBuy: params.isBuy,
      nonce: params.nonce,
      expiry: params.expiry,
    },
  };
}
