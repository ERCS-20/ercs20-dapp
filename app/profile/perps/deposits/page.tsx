import type { Metadata } from "next";

import { ProfilePerpsDepositHistoryPanel } from "@/components/profile/perps-deposits/profile-perps-deposit-history-panel";

export const metadata: Metadata = {
  title: "Perps Deposits · Profile · ERCS-20",
  description: "Perps deposit history.",
};

export default function ProfilePerpsDepositsPage() {
  return <ProfilePerpsDepositHistoryPanel />;
}
