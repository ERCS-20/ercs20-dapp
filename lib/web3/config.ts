import type { SupportedChainId } from "./chains";

/**
 * Read each `NEXT_PUBLIC_*` directly so Next/Turbopack can inline values in the client bundle.
 * `process.env[variable]` is often **not** inlined, so Hardhat RPC falls back to `127.0.0.1` in the wallet.
 */
const RPC_BY_CHAIN: Record<SupportedChainId, string | undefined> = {
  1: process.env.NEXT_PUBLIC_RPC_MAINNET?.trim() || undefined,
  11155111: process.env.NEXT_PUBLIC_RPC_SEPOLIA?.trim() || undefined,
  31337:
    process.env.NEXT_PUBLIC_RPC_HARDHAT?.trim()
};

export function getRpcUrl(chainId: SupportedChainId): string | undefined {
  return RPC_BY_CHAIN[chainId];
}
