import type { Metadata } from "next";

import { ProfileSpotDepositHistoryPanel } from "@/components/profile/spot-deposits/profile-spot-deposit-history-panel";

export const metadata: Metadata = {
  title: "Deposits · Profile · ERCS-20",
  description: "Spot deposit history.",
};

export default function ProfileDepositsPage() {
  return <ProfileSpotDepositHistoryPanel />;
}
