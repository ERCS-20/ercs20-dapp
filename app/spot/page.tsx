import { redirect } from "next/navigation";

import { getSpotDefaultPairPath } from "@/lib/config/spot-default-pair";

export default function SpotIndexPage() {
  redirect(`/spot/${getSpotDefaultPairPath()}`);
}
