import type { Metadata } from "next";

import { ProfilePerpsDepositView } from "@/components/profile/dashboard/profile-perps-deposit-view";

export const metadata: Metadata = {
  title: "Perps Deposit · Profile · ERCS-20",
  description: "Deposit ARC native USDC margin to your perps account",
};

export default function ProfilePerpsDepositPage() {
  return <ProfilePerpsDepositView />;
}
