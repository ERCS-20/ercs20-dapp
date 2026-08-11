import type { Metadata } from "next";

import { ProfileDeployErcs20View } from "@/components/profile/dashboard/profile-deploy-ercs20-view";

export const metadata: Metadata = {
  title: "Deploy ERCS-20 · Profile · ERCS-20",
  description: "Create an ERCS-20 token you control on-chain.",
};

export default function ProfileDeployErcs20Page() {
  return <ProfileDeployErcs20View />;
}
