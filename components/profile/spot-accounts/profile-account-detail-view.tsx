"use client";

import { useRouter } from "next/navigation";

import { ProfileAccountInfoCard } from "@/components/profile/spot-accounts/profile-account-info-card";
import { ProfileAccountLedgerTable } from "@/components/profile/spot-accounts/profile-account-ledger-table";
import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileShell, profileDetailSectionClass, type ProfileSection } from "@/components/profile/shell/profile-shell";
import { getMockUserBalanceByTokenAddress } from "@/lib/profile/mock-user-balances";
import { useI18n } from "@/providers/i18n-provider";

export function ProfileAccountDetailView({ tokenAddress }: { tokenAddress: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const account = getMockUserBalanceByTokenAddress(tokenAddress);

  function handleSectionChange(section: ProfileSection) {
    if (section === "dashboard") {
      router.push("/profile");
      return;
    }
    router.push(`/profile?section=${section}`);
  }

  if (!account) {
    return (
      <ProfileShell section="spot-accounts" onSectionChange={handleSectionChange}>
        <section className={profileDetailSectionClass}>
          <p className="text-muted-foreground text-sm">{t("profile.accountNotFound")}</p>
          <ProfileBackLink
            href="/profile?section=spot-accounts"
            label={t("profile.backToAccounts")}
            className="mt-4"
          />
        </section>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell section="spot-accounts" onSectionChange={handleSectionChange}>
      <section className={profileDetailSectionClass}>
        <ProfileBackLink
          href="/profile?section=spot-accounts"
          label={t("profile.backToAccounts")}
          className="mb-4"
        />
        <ProfileAccountInfoCard account={account} />
        <ProfileAccountLedgerTable tokenAddress={account.tokenAddress} symbol={account.symbol} />
      </section>
    </ProfileShell>
  );
}
