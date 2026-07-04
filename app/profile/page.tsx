import type { Metadata } from "next";

import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "Profile · ERCS-20",
  description: "Wallet account and network details.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
