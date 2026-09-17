import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileSpotWithdrawView } from "@/components/profile/dashboard/profile-spot-withdraw-view";

export const metadata: Metadata = {
  title: "Withdraw · Profile · ERCS-20",
  description: "Withdraw assets to your connected wallet.",
};

export default function ProfileWithdrawPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSpotWithdrawView />
    </Suspense>
  );
}
