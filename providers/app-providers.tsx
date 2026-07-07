"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { WrongNetworkGateProvider } from "@/components/wallet/wrong-network-gate";
import { AuthProvider } from "@/providers/auth-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Web3Provider } from "@/providers/web3-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>
        <Web3Provider>
          <AuthProvider>
            <WrongNetworkGateProvider>
              {children}
            </WrongNetworkGateProvider>
          </AuthProvider>
          <Toaster
            position={isDesktop ? "top-right" : "top-center"}
            duration={3000}
            richColors
            closeButton
          />
        </Web3Provider>
      </I18nProvider>
    </ThemeProvider>
  );
}
