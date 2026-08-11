import { redirect } from "next/navigation";

import { ProfileRoutes } from "@/lib/profile/routes";

export default function Ercs20Page() {
  redirect(ProfileRoutes.deployErcs20);
}
