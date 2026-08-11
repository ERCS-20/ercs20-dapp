import { publicEnv } from "@/lib/config/public-env";

export function getPerpsAssetVaultAddress(): `0x${string}` | undefined {
  const a = publicEnv.perpsAssetVaultAddress?.trim();
  if (!a || !a.startsWith("0x") || a.length < 42) return undefined;
  return a as `0x${string}`;
}

export function isPerpsAssetVaultConfigured(): boolean {
  return getPerpsAssetVaultAddress() != null;
}
