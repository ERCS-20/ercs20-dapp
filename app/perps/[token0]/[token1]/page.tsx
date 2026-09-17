import type { Metadata } from "next";

import { PerpsView } from "@/components/perps/perps-view";

export const metadata: Metadata = {
  title: "Perps · ERCS-20",
  description:
    "Perps trading terminal — chart, order book, market trades, and limit orders.",
};

type PageProps = {
  params: Promise<{ token0: string; token1: string }>;
};

export default async function PerpsPairPage({ params }: PageProps) {
  const { token0, token1 } = await params;
  return <PerpsView token0={token0} token1={token1} />;
}
