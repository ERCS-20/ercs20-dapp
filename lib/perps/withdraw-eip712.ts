import { zeroAddress } from "viem";

/** Align with `perps.contract.withdrawals.eip712` in perps-orders `application.yml`. */
export function getPerpsWithdrawEip712Domain(chainId: number) {
  return {
    name: process.env.NEXT_PUBLIC_EIP712_PERPS_WITHDRAW_NAME?.trim() || "PerpsExchange",
    version: process.env.NEXT_PUBLIC_EIP712_PERPS_WITHDRAW_VERSION?.trim() || "1",
    chainId,
    verifyingContract: zeroAddress,
  } as const;
}

export const PERPS_WITHDRAW_EIP712_TYPES = {
  PerpsWithdraw: [
    { name: "fromAddress", type: "address" },
    { name: "tokenAddress", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "salt", type: "uint256" },
  ],
} as const;

export function getPerpsWithdrawSignTypedData(
  params: {
    fromAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    amount: bigint;
    salt: bigint;
  },
  chainId: number
) {
  return {
    domain: getPerpsWithdrawEip712Domain(chainId),
    types: PERPS_WITHDRAW_EIP712_TYPES,
    primaryType: "PerpsWithdraw" as const,
    message: {
      fromAddress: params.fromAddress.toLowerCase() as `0x${string}`,
      tokenAddress: params.tokenAddress.toLowerCase() as `0x${string}`,
      amount: params.amount,
      salt: params.salt,
    },
  };
}
