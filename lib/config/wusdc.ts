/** WUSDC ERC-20 — spot ledger token for native USDC deposits (zero address in UI). */
export function getWusdcAddress(): `0x${string}` | undefined {
  const raw = process.env.NEXT_PUBLIC_WUSDC_ADDRESS?.trim();
  if (!raw) return undefined;
  return raw.toLowerCase() as `0x${string}`;
}

export function isWusdcConfigured(): boolean {
  return getWusdcAddress() != null;
}
