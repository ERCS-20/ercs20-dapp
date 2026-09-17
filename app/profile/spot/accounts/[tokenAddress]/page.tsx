import type { Metadata } from "next";

import { ProfileAccountDetailView } from "@/components/profile/spot-accounts/profile-account-detail-view";

export const metadata: Metadata = {
  title: "Account · Profile · ERCS-20",
  description: "Spot account details and ledger.",
};

type PageProps = {
  params: Promise<{ tokenAddress: string }>;
};

export default async function ProfileAccountDetailPage({ params }: PageProps) {
  const { tokenAddress } = await params;
  return <ProfileAccountDetailView tokenAddress={decodeURIComponent(tokenAddress)} />;
}
