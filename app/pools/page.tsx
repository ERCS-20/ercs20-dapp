import type { Metadata } from "next";

import { PoolsView } from "@/components/pools/pools-view";

export const metadata: Metadata = {
  title: "Pools · ERCS-20",
  description: "Preview of protocol-token staking pools and mining rewards.",
};

export default function PoolsPage() {
  return <PoolsView />;
}
