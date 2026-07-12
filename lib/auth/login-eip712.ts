import { AUTH_CLIENT_TYPE } from "@/lib/auth/codes";
import { getLoginEip712Domain, LOGIN_EIP712_TYPES } from "@/lib/config/auth-eip712";
import type { AuthLoginReq } from "@/services/auth/types";

export function buildAuthLoginRequest(
  walletAddress: `0x${string}`,
  signature: `0x${string}`,
  timestamp = Math.floor(Date.now() / 1000)
): AuthLoginReq {
  return {
    walletAddress: walletAddress.toLowerCase(),
    timestamp,
    signature,
    clientType: AUTH_CLIENT_TYPE,
  };
}

export function getLoginSignTypedData(
  walletAddress: `0x${string}`,
  timestamp: number,
  chainId: number
) {
  return {
    domain: getLoginEip712Domain(chainId),
    types: LOGIN_EIP712_TYPES,
    primaryType: "UserLogin" as const,
    message: {
      walletAddress: walletAddress.toLowerCase() as `0x${string}`,
      timestamp: BigInt(timestamp),
      clientType: AUTH_CLIENT_TYPE,
    },
  };
}
