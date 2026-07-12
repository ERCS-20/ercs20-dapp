import { zeroAddress } from "viem";

/** Align with `spot.contract.withdrawals.eip712` in spot-orders `application.yml`. */
export function getWithdrawEip712Domain(chainId: number) {
  return {
    name: process.env.NEXT_PUBLIC_EIP712_WITHDRAW_NAME?.trim() || "SpotWithdrawals",
    version: process.env.NEXT_PUBLIC_EIP712_WITHDRAW_VERSION?.trim() || "1",
    chainId,
    verifyingContract: zeroAddress,
  } as const;
}

export const WITHDRAW_EIP712_TYPES = {
  SpotWithdraw: [
    { name: "fromAddress", type: "address" },
    { name: "tokenAddress", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "salt", type: "uint256" },
  ],
} as const;

export function getWithdrawSignTypedData(
  params: {
    fromAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    amount: bigint;
    salt: bigint;
  },
  chainId: number
) {
  return {
    domain: getWithdrawEip712Domain(chainId),
    types: WITHDRAW_EIP712_TYPES,
    primaryType: "SpotWithdraw" as const,
    message: {
      fromAddress: params.fromAddress.toLowerCase() as `0x${string}`,
      tokenAddress: params.tokenAddress.toLowerCase() as `0x${string}`,
      amount: params.amount,
      salt: params.salt,
    },
  };
}
