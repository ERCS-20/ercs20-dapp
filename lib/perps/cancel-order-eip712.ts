import { getPerpsExchangeAddress } from "@/lib/config/perps-exchange";

/**
 * Align with perps-orders EIP-712 domain (`perps.contract.exchange.eip712`).
 * Name/version from `NEXT_PUBLIC_EIP712_PERPS_CANCEL_ORDER_*` (defaults match PerpsExchange).
 */
export function getCancelOrderEip712Domain(chainId: number) {
  const verifyingContract = getPerpsExchangeAddress();
  if (!verifyingContract) {
    throw new Error("Missing NEXT_PUBLIC_PERPS_EXCHANGE_ADDRESS");
  }

  return {
    name:
      process.env.NEXT_PUBLIC_EIP712_PERPS_CANCEL_ORDER_NAME?.trim() ||
      process.env.NEXT_PUBLIC_EIP712_PERPS_EXCHANGE_NAME?.trim() ||
      "PerpsExchange",
    version:
      process.env.NEXT_PUBLIC_EIP712_PERPS_CANCEL_ORDER_VERSION?.trim() ||
      process.env.NEXT_PUBLIC_EIP712_PERPS_EXCHANGE_VERSION?.trim() ||
      "1",
    chainId,
    verifyingContract,
  } as const;
}

export const CANCEL_ORDER_EIP712_TYPES = {
  PerpsCancelOrder: [
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
    primaryType: "PerpsCancelOrder" as const,
    message: {
      orderId: params.orderId,
      salt: params.salt,
    },
  };
}
