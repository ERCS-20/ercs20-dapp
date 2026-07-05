"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ProfileDashboardPanel } from "@/components/profile/dashboard/profile-dashboard-panel";
import { ProfileSpotDepositHistoryPanel } from "@/components/profile/spot-deposits/profile-spot-deposit-history-panel";
import { ProfileSpotBalancesTable } from "@/components/profile/spot-accounts/profile-spot-balances-table";
import { ProfileSpotWithdrawHistoryPanel } from "@/components/profile/spot-withdrawals/profile-spot-withdraw-history-panel";
import { ProfileShell, type ProfileSection } from "@/components/profile/shell/profile-shell";

const validSections = new Set<ProfileSection>([
  "dashboard",
  "spot-accounts",
  "spot-deposits",
  "spot-withdrawals",
]);

function parseSection(value: string | null): ProfileSection {
  if (value && validSections.has(value as ProfileSection)) {
    return value as ProfileSection;
  }
  return "dashboard";
}

function ProfileViewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [section, setSection] = useState<ProfileSection>(() => parseSection(sectionParam));

  useEffect(() => {
    setSection(parseSection(sectionParam));
  }, [sectionParam]);

  function handleSectionChange(next: ProfileSection) {
    setSection(next);
    if (next === "dashboard") {
      router.replace("/profile");
      return;
    }
    router.replace(`/profile?section=${next}`);
  }

  return (
    <ProfileShell section={section} onSectionChange={handleSectionChange}>
      {section === "dashboard" && <ProfileDashboardPanel />}
      {section === "spot-accounts" && (
        <ProfileSpotBalancesTable titleKey="profile.spotAccountList" />
      )}
      {section === "spot-deposits" && <ProfileSpotDepositHistoryPanel />}
      {section === "spot-withdrawals" && <ProfileSpotWithdrawHistoryPanel />}
    </ProfileShell>
  );
}

export function ProfileView() {
  return (
    <Suspense fallback={null}>
      <ProfileViewInner />
    </Suspense>
  );
}
