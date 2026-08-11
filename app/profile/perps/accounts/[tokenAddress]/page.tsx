import type { Metadata } from "next";

import { ProfilePerpsAccountDetailView } from "@/components/profile/perps-accounts/profile-perps-account-detail-view";

export const metadata: Metadata = {
  title: "Perps Account · Profile · ERCS-20",
  description: "Perps account details and ledger.",
};

type PageProps = {
  params: Promise<{ tokenAddress: string }>;
};

export default async function ProfilePerpsAccountDetailPage({ params }: PageProps) {
  const { tokenAddress } = await params;
  return <ProfilePerpsAccountDetailView tokenAddress={decodeURIComponent(tokenAddress)} />;
}
