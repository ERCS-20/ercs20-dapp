import { defineChain, type Chain } from "viem";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

function envRpc(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

/**
 * Target chain for swap / deploy (same as `NEXT_PUBLIC_CHAIN_ID` in `.env`).
 */
export function getAppChainId(): number | undefined {
  const n = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "");
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.trunc(n);
}

const rpcMainnet = envRpc("NEXT_PUBLIC_RPC_MAINNET");
const rpcSepolia = envRpc("NEXT_PUBLIC_RPC_SEPOLIA");
const rpcHardhat =
  envRpc("NEXT_PUBLIC_RPC_HARDHAT") ?? "http://127.0.0.1:8545";
const rpcArcTestnet =
  envRpc("NEXT_PUBLIC_RPC_ARC_TESTNET") ??
  "https://rpc.testnet.arc.network";

/** Ethereum mainnet — optional `NEXT_PUBLIC_RPC_MAINNET`. */
export const mainnetChain = defineChain({
  ...mainnet,
  rpcUrls: {
    ...mainnet.rpcUrls,
    default: {
      http: rpcMainnet ? [rpcMainnet] : [...mainnet.rpcUrls.default.http],
    },
  },
});

/** Sepolia — optional `NEXT_PUBLIC_RPC_SEPOLIA`. */
export const sepoliaChain = defineChain({
  ...sepolia,
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: {
      http: rpcSepolia ? [rpcSepolia] : [...sepolia.rpcUrls.default.http],
    },
  },
});

/**
 * Hardhat / Anvil (chainId 31337).
 * `NEXT_PUBLIC_RPC_HARDHAT` or default `http://127.0.0.1:8545` (wallet_addEthereumChain).
 */
export const hardhatChain = defineChain({
  ...hardhat,
  rpcUrls: {
    ...hardhat.rpcUrls,
    default: { http: [rpcHardhat] },
  },
});

/**
 * Arc Testnet — https://docs.arc.network/arc/references/connect-to-arc
 * `NEXT_PUBLIC_RPC_ARC_TESTNET` or default `https://rpc.testnet.arc.network`.
 */
export const arcTestnetChain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [rpcArcTestnet] },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/** All chains the wallet may connect to; order = RainbowKit list order. */
export const supportedChains = [
  mainnetChain,
  sepoliaChain,
  hardhatChain,
  arcTestnetChain,
] as const;

export type SupportedChain = (typeof supportedChains)[number];

const byId = new Map<number, Chain>(
  supportedChains.map((c) => [c.id, c])
);

export function getChainById(id: number): Chain | undefined {
  return byId.get(id);
}

export function isSupportedChainId(id: number): boolean {
  return byId.has(id);
}

/** Named ids for tests / call sites that prefer symbols. */
export const CHAIN_IDS = {
  mainnet: mainnetChain.id,
  sepolia: sepoliaChain.id,
  hardhat: hardhatChain.id,
  arcTestnet: arcTestnetChain.id,
} as const;

export type SupportedChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];
