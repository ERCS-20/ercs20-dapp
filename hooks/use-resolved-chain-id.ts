"use client";

import { useAccount } from "wagmi";

import { getCachedChainId } from "@/lib/wallet/cached-chain-id";

/**
 * Wagmi `chainId` with sessionStorage fallback while connected / reconnecting.
 * Updated on connect, chain switch, and whenever wagmi reports a chain id.
 */
export function useResolvedChainId(): number | undefined {
  const { chainId, isConnected, status } = useAccount();

  if (chainId != null) return chainId;

  if (isConnected || status === "reconnecting" || status === "connecting") {
    return getCachedChainId();
  }

  return undefined;
}
