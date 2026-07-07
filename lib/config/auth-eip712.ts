import { getAppChainId } from "@/lib/web3/chains";

/** Align with `spot.users.eip712.login` in spot-users `application.yml`. */
export function getLoginEip712Domain() {
  const chainId =
    Number(process.env.NEXT_PUBLIC_EIP712_LOGIN_CHAIN_ID) || getAppChainId() || 31337;

  return {
    name: process.env.NEXT_PUBLIC_EIP712_LOGIN_NAME?.trim() || "Orbix exchange",
    version: process.env.NEXT_PUBLIC_EIP712_LOGIN_VERSION?.trim() || "1",
    chainId,
    verifyingContract: "0x0000000000000000000000000000000000000000" as const,
  };
}

export const LOGIN_EIP712_TYPES = {
  UserLogin: [
    { name: "walletAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "clientType", type: "string" },
  ],
} as const;
