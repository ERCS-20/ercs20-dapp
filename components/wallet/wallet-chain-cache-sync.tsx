"use client";

import { useEffect } from "react";
import { useAccount, useAccountEffect } from "wagmi";

import { clearCachedChainId, setCachedChainId } from "@/lib/wallet/cached-chain-id";

/** Keep session chain id in sync with connect / switch / disconnect. */
export function WalletChainCacheSync() {
  const { chainId, isConnected } = useAccount();

  useAccountEffect({
    onConnect({ chainId: connectedChainId }) {
      setCachedChainId(connectedChainId);
    },
    onDisconnect() {
      clearCachedChainId();
    },
  });

  useEffect(() => {
    if (chainId != null) {
      setCachedChainId(chainId);
      return;
    }
    if (!isConnected) {
      clearCachedChainId();
    }
  }, [chainId, isConnected]);

  return null;
}
