import type { Metadata } from "next";

import { ProfilePerpsBalancesTable } from "@/components/profile/perps-accounts/profile-perps-balances-table";

export const metadata: Metadata = {
  title: "Perps Accounts · Profile · ERCS-20",
  description: "Perps account balances.",
};

export default function ProfilePerpsAccountsPage() {
  return <ProfilePerpsBalancesTable />;
}
