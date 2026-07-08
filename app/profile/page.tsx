import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileDashboardPanel } from "@/components/profile/dashboard/profile-dashboard-panel";
import { ProfileLegacySectionRedirect } from "@/components/profile/shell/profile-legacy-section-redirect";

export const metadata: Metadata = {
  title: "Profile · ERCS-20",
  description: "Wallet account and network details.",
};

export default function ProfilePage() {
  return (
    <>
      <Suspense fallback={null}>
        <ProfileLegacySectionRedirect />
      </Suspense>
      <ProfileDashboardPanel />
    </>
  );
}
