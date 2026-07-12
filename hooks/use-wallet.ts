"use client";

import { useAccount } from "wagmi";

import { useResolvedChainId } from "@/hooks/use-resolved-chain-id";

export function useWallet() {
  const { address, isConnected, status } = useAccount();
  const chainId = useResolvedChainId();
  return {
    address,
    isConnected,
    chainId,
    isReconnecting: status === "reconnecting",
    isConnecting: status === "connecting",
  };
}
