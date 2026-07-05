import type { Metadata } from "next";

import { ProfileAccountDetailView } from "@/components/profile/spot-accounts/profile-account-detail-view";

type PageProps = {
  params: Promise<{ tokenAddress: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tokenAddress } = await params;
  return {
    title: `Account · ${decodeURIComponent(tokenAddress).slice(0, 10)}… · ERCS-20`,
    description: "Spot account details and ledger history.",
  };
}

export default async function ProfileAccountPage({ params }: PageProps) {
  const { tokenAddress } = await params;
  return <ProfileAccountDetailView tokenAddress={decodeURIComponent(tokenAddress)} />;
}
