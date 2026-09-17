import { redirect } from "next/navigation";

import { getPerpsDefaultPairPath } from "@/lib/config/perps-default-pair";

export default function PerpsIndexPage() {
  redirect(`/perps/${getPerpsDefaultPairPath()}`);
}
