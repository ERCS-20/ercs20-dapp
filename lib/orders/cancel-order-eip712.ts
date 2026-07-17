import { getSpotExchangeAddress } from "@/lib/config/spot-exchange";

/**
 * Align with `OrdersEIP712Signature` domain (`spot.contract.exchange.eip712`).
 * Name/version from `NEXT_PUBLIC_EIP712_CANCEL_ORDER_*` (defaults match application.yml).
 */
export function getCancelOrderEip712Domain(chainId: number) {
  const verifyingContract = getSpotExchangeAddress();
  if (!verifyingContract) {
    throw new Error("Missing NEXT_PUBLIC_SPOT_EXCHANGE_ADDRESS");
  }

  return {
    name: process.env.NEXT_PUBLIC_EIP712_CANCEL_ORDER_NAME?.trim() || "SpotExchange",
    version: process.env.NEXT_PUBLIC_EIP712_CANCEL_ORDER_VERSION?.trim() || "1",
    chainId,
    verifyingContract,
  } as const;
}

/**
 * Align with `OrdersEIP712Signature.SPOT_CANCEL_ORDER_TYPE`:
 * `SpotCancelOrder(uint256 orderId,uint256 salt)`
 */
export const CANCEL_ORDER_EIP712_TYPES = {
  SpotCancelOrder: [
    { name: "orderId", type: "uint256" },
    { name: "salt", type: "uint256" },
  ],
} as const;

export function getCancelOrderSignTypedData(
  params: {
    orderId: bigint;
    salt: bigint;
  },
  chainId: number
) {
  return {
    domain: getCancelOrderEip712Domain(chainId),
    types: CANCEL_ORDER_EIP712_TYPES,
    primaryType: "SpotCancelOrder" as const,
    message: {
      orderId: params.orderId,
      salt: params.salt,
    },
  };
}
