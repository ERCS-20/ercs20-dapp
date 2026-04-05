import type { SupportedChainId } from "./chains";

const env = (key: string) => process.env[key]?.trim() || undefined;

const HARDHAT_DEFAULT_RPC = "http://127.0.0.1:8545";

/** RPC URLs keyed by chain; set in `.env.local` with `NEXT_PUBLIC_` for client use. */
export function getRpcUrl(chainId: SupportedChainId): string | undefined {
  const map: Record<SupportedChainId, string | undefined> = {
    1: env("NEXT_PUBLIC_RPC_MAINNET"),
    11155111: env("NEXT_PUBLIC_RPC_SEPOLIA"),
    31337: env("NEXT_PUBLIC_RPC_HARDHAT") ?? HARDHAT_DEFAULT_RPC,
  };
  return map[chainId];
}
