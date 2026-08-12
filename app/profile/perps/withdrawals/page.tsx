import type { Metadata } from "next";

import { ProfilePerpsWithdrawHistoryPanel } from "@/components/profile/perps-withdrawals/profile-perps-withdraw-history-panel";

export const metadata: Metadata = {
  title: "Perps Withdrawals · Profile · ERCS-20",
  description: "Perps withdrawal history.",
};

export default function ProfilePerpsWithdrawalsPage() {
  return <ProfilePerpsWithdrawHistoryPanel />;
}
