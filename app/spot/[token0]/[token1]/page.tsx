import type { Metadata } from "next";

import { SpotView } from "@/components/spot/spot-view";

export const metadata: Metadata = {
  title: "Spot · ERCS-20",
  description:
    "Spot trading terminal — chart, order book, market trades, and limit orders (Phase 2 settlement simulated).",
};

type PageProps = {
  params: Promise<{ token0: string; token1: string }>;
};

export default async function SpotPairPage({ params }: PageProps) {
  const { token0, token1 } = await params;
  return <SpotView token0={token0} token1={token1} />;
}
