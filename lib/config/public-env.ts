import { getAppChainId } from "@/lib/web3/chains";

/**
 * Public environment placeholders (fill in `.env.local`).
 * Client-safe keys must use the `NEXT_PUBLIC_` prefix.
 * (Keys keep `ERCS20` without hyphen; product naming in UI is ERCS-20.)
 */
export const publicEnv = {
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  /** Same as `getAppChainId()` — `NEXT_PUBLIC_CHAIN_ID`. */
  chainId: getAppChainId(),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "",
  ercs20FactoryAddress:
    process.env.NEXT_PUBLIC_ERCS20_FACTORY_ADDRESS ??
    process.env.NEXT_PUBLIC_ERC20_FACTORY_ADDRESS ??
    "",
  defaultErcs20Token: process.env.NEXT_PUBLIC_DEFAULT_ERCS20_TOKEN ?? "",
  spotAssetVaultAddress: process.env.NEXT_PUBLIC_SPOT_ASSET_VAULT_ADDRESS ?? "",
  spotPairFactoryAddress: process.env.NEXT_PUBLIC_SPOT_PAIR_FACTORY ?? "",
  spotExchangeAddress: process.env.NEXT_PUBLIC_SPOT_EXCHANGE_ADDRESS ?? "",
  spotDefaultBaseTokenSymbol:
    process.env.NEXT_PUBLIC_SPOT_DEFAULT_BASE_TOKEN_SYMBOL?.trim() || "OBX",
  spotDefaultQuoteTokenSymbol:
    process.env.NEXT_PUBLIC_SPOT_DEFAULT_QUOTE_TOKEN_SYMBOL?.trim() || "USDC",
  /** API origin only, e.g. `https://api.example.com` (no `/api/v1`). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  /** Block explorer base URL, e.g. `https://explorer.testnet.arc.network`. */
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "",
  /** Global REST prefix, e.g. `/api/v1`. Overridable via env. */
  apiPathPrefix: process.env.NEXT_PUBLIC_API_PATH_PREFIX ?? "/api/v1",
} as const;

/** Default ERC-20 / spot amount decimals (`NEXT_PUBLIC_DEFAULT_DECIMALS`, default 18). */
export function getDefaultDecimals(): number {
  const n = Number(process.env.NEXT_PUBLIC_DEFAULT_DECIMALS ?? "18");
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 18;
}

export function getApiBaseUrl(): string {
  return publicEnv.apiBaseUrl.replace(/\/$/, "");
}

export function getApiPathPrefix(): string {
  const raw = publicEnv.apiPathPrefix.trim();
  if (!raw) return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.replace(/\/$/, "");
}

export function getExplorerTxUrl(txHash: string): string | null {
  const base = publicEnv.explorerUrl.trim().replace(/\/$/, "");
  const hash = txHash.trim();
  if (!base || !hash) return null;
  return `${base}/tx/${hash}`;
}
