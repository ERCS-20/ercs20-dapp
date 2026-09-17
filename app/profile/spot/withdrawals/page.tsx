import type { Metadata } from "next";

import { ProfileSpotWithdrawHistoryPanel } from "@/components/profile/spot-withdrawals/profile-spot-withdraw-history-panel";

export const metadata: Metadata = {
  title: "Withdrawals · Profile · ERCS-20",
  description: "Spot withdrawal history.",
};

export default function ProfileWithdrawalsPage() {
  return <ProfileSpotWithdrawHistoryPanel />;
}
