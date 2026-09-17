import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileSpotApplyListView } from "@/components/profile/dashboard/profile-spot-apply-list-view";

export const metadata: Metadata = {
  title: "Apply to List (Spot) · Profile · ERCS-20",
  description: "Register an ERCS-20 token for spot trading.",
};

export default function ProfileApplyListPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSpotApplyListView />
    </Suspense>
  );
}
