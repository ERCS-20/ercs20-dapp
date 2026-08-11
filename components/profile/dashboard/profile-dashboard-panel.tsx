"use client";

import type { ReactNode } from "react";
import {
  DownloadIcon,
  ListPlusIcon,
  RocketIcon,
  UploadIcon,
} from "lucide-react";

import { ProfileActionLinkCard } from "@/components/profile/dashboard/profile-action-link-card";
import { ProfileRoutes } from "@/lib/profile/routes";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

function DashboardSectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-border/60 bg-card rounded-2xl border p-5 sm:p-6",
        className
      )}
    >
      <h3 className="text-foreground text-base font-medium">{title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export function ProfileDashboardPanel() {
  const { t } = useI18n();

  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="text-foreground text-base font-medium sm:text-lg">
        {t("profile.dashboard")}
      </h2>

      <DashboardSectionCard title={t("profile.perps")}>
        <ProfileActionLinkCard
          href={ProfileRoutes.perpsDeposit}
          tone="brand"
          icon={<DownloadIcon className="size-6" aria-hidden />}
          title={t("profile.deposit")}
          description={t("profile.perpsDepositCardDesc")}
        />
        <ProfileActionLinkCard
          href="/perps"
          tone="brand-alt"
          icon={<UploadIcon className="size-6" aria-hidden />}
          title={t("profile.withdraw")}
          description={t("profile.perpsWithdrawCardDesc")}
        />
      </DashboardSectionCard>

      <DashboardSectionCard title={t("profile.spot")}>
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
      </DashboardSectionCard>

      <DashboardSectionCard title={t("profile.tokenLaunch")}>
        <ProfileActionLinkCard
          href={ProfileRoutes.deployErcs20}
          tone="brand"
          icon={<RocketIcon className="size-6" aria-hidden />}
          title={t("profile.deployErcs20")}
          description={t("profile.deployErcs20CardDesc")}
        />
        <ProfileActionLinkCard
          href={ProfileRoutes.applyList}
          tone="brand"
          icon={<ListPlusIcon className="size-6" aria-hidden />}
          title={t("profile.applyListSpot")}
          description={t("profile.applyListSpotCardDesc")}
        />
        <ProfileActionLinkCard
          href="/perps"
          tone="brand-alt"
          icon={<ListPlusIcon className="size-6" aria-hidden />}
          title={t("profile.applyListPerps")}
          description={t("profile.applyListPerpsCardDesc")}
        />
      </DashboardSectionCard>
    </div>
  );
}
