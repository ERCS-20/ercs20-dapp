"use client";

import { DownloadIcon, ListPlusIcon, UploadIcon } from "lucide-react";

import { ProfileActionLinkCard } from "@/components/profile/dashboard/profile-action-link-card";
import { ProfileRoutes } from "@/lib/profile/routes";
import { useI18n } from "@/providers/i18n-provider";

export function ProfileDashboardPanel() {
  const { t } = useI18n();

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <h2 className="text-foreground text-base font-medium">{t("profile.dashboard")}</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <ProfileActionLinkCard
          href={ProfileRoutes.deposit}
          tone="brand"
          icon={<DownloadIcon className="size-6" aria-hidden />}
          title={t("profile.deposit")}
          description={t("profile.depositCardDesc")}
        />
        <ProfileActionLinkCard
          href={ProfileRoutes.withdraw}
          tone="brand-alt"
          icon={<UploadIcon className="size-6" aria-hidden />}
          title={t("profile.withdraw")}
          description={t("profile.withdrawCardDesc")}
        />
        <ProfileActionLinkCard
          href={ProfileRoutes.applyList}
          tone="brand"
          icon={<ListPlusIcon className="size-6" aria-hidden />}
          title={t("profile.applyListSpot")}
          description={t("profile.applyListSpotCardDesc")}
        />
      </div>
    </section>
  );
}
