import type { Metadata } from "next";

import { SwapCard } from "@/components/swap/swap-card";

export const metadata: Metadata = {
  title: "Swap · ERCS-20",
  description:
    "Swap ERCS-20 tokens against the built-in AMM quote asset. Connect a wallet when routing is enabled.",
};

export default function SwapPage() {
  return <SwapCard />;
}
