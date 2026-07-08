"use client";

import { ProfileAccountInfoCard } from "@/components/profile/spot-accounts/profile-account-info-card";
import { ProfileAccountLedgerTable } from "@/components/profile/spot-accounts/profile-account-ledger-table";
import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { profileTableSectionClass } from "@/lib/profile/table-filters";
import { ProfileRoutes } from "@/lib/profile/routes";
import { useUserBalance } from "@/services/spot/accounts/hooks";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export function ProfileAccountDetailView({ tokenAddress }: { tokenAddress: string }) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data: account, isLoading, isError } = useUserBalance(tokenAddress, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <section className={profileTableSectionClass}>
        <p className="text-muted-foreground text-sm">{t("profile.accountNotFound")}</p>
        <ProfileBackLink
          href={ProfileRoutes.accounts}
          label={t("profile.backToAccounts")}
          className="mt-4"
        />
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <ProfileBackLink
          href={ProfileRoutes.accounts}
          label={t("profile.backToAccounts")}
        />
        <section className={profileTableSectionClass}>
          <p className="text-muted-foreground text-sm">{t("swap.loading")}</p>
        </section>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <ProfileBackLink
          href={ProfileRoutes.accounts}
          label={t("profile.backToAccounts")}
        />
        <section className={profileTableSectionClass}>
          <p className="text-muted-foreground text-sm">{t("profile.accountNotFound")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <ProfileBackLink href={ProfileRoutes.accounts} label={t("profile.backToAccounts")} />
      <ProfileAccountInfoCard account={account} />
      <ProfileAccountLedgerTable tokenAddress={account.tokenAddress} symbol={account.symbol} />
    </div>
  );
}
