import { publicEnv } from "@/lib/config/public-env";

export function getSpotPairFactoryAddress(): `0x${string}` | undefined {
  const raw = publicEnv.spotPairFactoryAddress?.trim();
  if (!raw || !raw.startsWith("0x") || raw.length < 42) return undefined;
  return raw.toLowerCase() as `0x${string}`;
}

export function isSpotPairFactoryConfigured(): boolean {
  return getSpotPairFactoryAddress() != null;
}
