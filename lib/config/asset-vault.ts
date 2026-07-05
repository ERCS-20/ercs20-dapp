import { publicEnv } from "@/lib/config/public-env";

export function getAssetVaultAddress(): `0x${string}` | undefined {
  const a = publicEnv.spotAssetVaultAddress?.trim();
  if (!a || !a.startsWith("0x") || a.length < 42) return undefined;
  return a as `0x${string}`;
}

export function isAssetVaultConfigured(): boolean {
  return getAssetVaultAddress() != null;
}

/** Mock USDC uses zero address — treat as native coin for vault deposit. */
export function isNativeVaultToken(tokenAddress: string): boolean {
  return tokenAddress.toLowerCase() === "0x0000000000000000000000000000000000000000";
}
