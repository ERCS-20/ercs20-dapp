import type { SupportedChainId } from "@/lib/web3/chains";

/** ERC-20 token address per chain; fill when you deploy or use a known token. */
export const TOKEN_ADDRESSES: Partial<Record<SupportedChainId, `0x${string}`>> =
  {};
