"use client";

import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";

import { WalletChainCacheSync } from "@/components/wallet/wallet-chain-cache-sync";
import { wagmiConfig } from "@/lib/wagmi/wagmi-config";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const rkTheme = useMemo(() => {
    if (!mounted) return lightTheme();
    return resolvedTheme === "dark" ? darkTheme() : lightTheme();
  }, [mounted, resolvedTheme]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme}>
          <WalletChainCacheSync />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
