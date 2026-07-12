import { publicEnv } from "@/lib/config/public-env";

/** SpotExchange contract — EIP-712 `verifyingContract` for place/cancel order. */
export function getSpotExchangeAddress(): `0x${string}` | undefined {
  const raw = publicEnv.spotExchangeAddress?.trim();
  if (!raw || !raw.startsWith("0x") || raw.length < 42) return undefined;
  return raw.toLowerCase() as `0x${string}`;
}

export function isSpotExchangeConfigured(): boolean {
  return getSpotExchangeAddress() != null;
}
