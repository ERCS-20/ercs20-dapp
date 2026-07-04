import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileWithdrawView } from "@/components/profile/profile-withdraw-view";

export const metadata: Metadata = {
  title: "Withdraw · Profile · ERCS-20",
  description: "Withdraw assets to your connected wallet.",
};

export default function ProfileWithdrawPage() {
  return (
    <Suspense fallback={null}>
      <ProfileWithdrawView />
    </Suspense>
  );
}
