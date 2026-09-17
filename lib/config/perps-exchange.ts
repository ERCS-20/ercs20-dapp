import { publicEnv } from "@/lib/config/public-env";

/** PerpsExchange contract — EIP-712 `verifyingContract` for place/cancel order. */
export function getPerpsExchangeAddress(): `0x${string}` | undefined {
  const raw = publicEnv.perpsExchangeAddress?.trim();
  if (!raw || !raw.startsWith("0x") || raw.length < 42) return undefined;
  return raw.toLowerCase() as `0x${string}`;
}

export function isPerpsExchangeConfigured(): boolean {
  return getPerpsExchangeAddress() != null;
}
