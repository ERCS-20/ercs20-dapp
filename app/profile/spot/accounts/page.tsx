import type { Metadata } from "next";

import { ProfileSpotBalancesTable } from "@/components/profile/spot-accounts/profile-spot-balances-table";

export const metadata: Metadata = {
  title: "Accounts · Profile · ERCS-20",
  description: "Spot account balances.",
};

export default function ProfileAccountsPage() {
  return <ProfileSpotBalancesTable titleKey="profile.spotAccountList" />;
}
