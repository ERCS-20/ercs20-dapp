import type { Metadata } from "next";

import { ProfilePerpsWithdrawView } from "@/components/profile/dashboard/profile-perps-withdraw-view";

export const metadata: Metadata = {
  title: "Perps Withdraw · Profile · ERCS-20",
  description: "Withdraw ARC native USDC margin from your perps account",
};

export default function ProfilePerpsWithdrawPage() {
  return <ProfilePerpsWithdrawView />;
}
