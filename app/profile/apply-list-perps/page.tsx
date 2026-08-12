import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileApplyListPerpsView } from "@/components/profile/dashboard/profile-apply-list-perps-view";

export const metadata: Metadata = {
  title: "Apply to List (Perps) · Profile · ERCS-20",
  description: "Register an ERCS-20 token for perps trading.",
};

export default function ProfileApplyListPerpsPage() {
  return (
    <Suspense fallback={null}>
      <ProfileApplyListPerpsView />
    </Suspense>
  );
}
