import { redirect } from "next/navigation";

import { getSpotPairs, pairPath } from "@/lib/spot/mock-market";

export default function SpotIndexPage() {
  const pairs = getSpotPairs();
  redirect(`/spot/${pairPath(pairs[0]!)}`);
}
