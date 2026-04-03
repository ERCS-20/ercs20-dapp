"use client";

import type { ReactNode } from "react";

/** Wrap the tree here when you add Wagmi / RainbowKit config. */
export function Web3Provider({ children }: { children: ReactNode }) {
  return children;
}
