import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileDepositView } from "@/components/profile/dashboard/profile-deposit-view";

export const metadata: Metadata = {
  title: "Deposit · Profile · ERCS-20",
  description: "Deposit assets to your spot account.",
};

export default function ProfileDepositPage() {
  return (
    <Suspense fallback={null}>
      <ProfileDepositView />
    </Suspense>
  );
}
