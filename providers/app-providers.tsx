"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/providers/i18n-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Web3Provider } from "@/providers/web3-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Web3Provider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </Web3Provider>
      </I18nProvider>
    </ThemeProvider>
  );
}
