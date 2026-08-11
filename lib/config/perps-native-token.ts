import { publicEnv } from "@/lib/config/public-env";

/** Ledger token for ARC native USDC in perps-accounts (not a real ERC-20). */
export function getPerpsNativeTokenAddress(): `0x${string}` {
  const a = publicEnv.perpsNativeTokenAddress.trim().toLowerCase();
  return a as `0x${string}`;
}
