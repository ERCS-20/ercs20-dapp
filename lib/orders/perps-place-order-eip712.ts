import { getPerpsExchangeAddress } from "@/lib/config/perps-exchange";

/** Align with `perps.contract.exchange.eip712` in perps-orders `application.yml`. */
export function getPlaceOrderEip712Domain(chainId: number) {
  const verifyingContract = getPerpsExchangeAddress();
  if (!verifyingContract) {
    throw new Error("Missing NEXT_PUBLIC_PERPS_EXCHANGE_ADDRESS");
  }

  return {
    name: process.env.NEXT_PUBLIC_EIP712_PERPS_EXCHANGE_NAME?.trim() || "PerpsExchange",
    version: process.env.NEXT_PUBLIC_EIP712_PERPS_EXCHANGE_VERSION?.trim() || "1",
    chainId,
    verifyingContract,
  } as const;
}

export const PLACE_ORDER_EIP712_TYPES = {
  PerpsOrder: [
    { name: "maker", type: "address" },
    { name: "makerToken", type: "address" },
    { name: "takerToken", type: "address" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "salt", type: "uint256" },
    { name: "timeInForce", type: "uint8" },
  ],
} as const;

export function getPlaceOrderSignTypedData(
  params: {
    maker: `0x${string}`;
    makerToken: `0x${string}`;
    takerToken: `0x${string}`;
    makerAmount: bigint;
    takerAmount: bigint;
    expiry: bigint;
    salt: bigint;
    timeInForce: number;
  },
  chainId: number
) {
  return {
    domain: getPlaceOrderEip712Domain(chainId),
    types: PLACE_ORDER_EIP712_TYPES,
    primaryType: "PerpsOrder" as const,
    message: {
      maker: params.maker.toLowerCase() as `0x${string}`,
      makerToken: params.makerToken.toLowerCase() as `0x${string}`,
      takerToken: params.takerToken.toLowerCase() as `0x${string}`,
      makerAmount: params.makerAmount,
      takerAmount: params.takerAmount,
      expiry: params.expiry,
      salt: params.salt,
      timeInForce: params.timeInForce,
    },
  };
}
