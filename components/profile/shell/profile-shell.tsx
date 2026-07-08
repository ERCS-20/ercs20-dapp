"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  DownloadIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  UploadIcon,
  WalletIcon,
} from "lucide-react";

import { ProfileOnChainWalletBar } from "@/components/profile/shell/profile-on-chain-wallet-bar";
import { PageShell } from "@/components/layout/page-shell";
import { pathnameToProfileSection, ProfileRoutes, type ProfileSection } from "@/lib/profile/routes";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

export const profilePageShellClass =
  "flex min-h-[calc(100svh-3.5rem)] flex-col px-0 py-0 sm:min-h-[calc(100svh-4rem)]";

export const profileDetailSectionClass =
  "border-border/60 bg-card flex min-h-0 flex-1 flex-col rounded-2xl border p-5 sm:p-6";

export type { ProfileSection };

type SpotNavItem = {
  section: ProfileSection;
  href: string;
  label: string;
  icon: typeof WalletIcon;
};

export function ProfileShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const section = pathnameToProfileSection(pathname);

  const spotSubItems: SpotNavItem[] = [
    {
      section: "spot-accounts",
      href: ProfileRoutes.accounts,
      label: t("profile.spotAccountList"),
      icon: WalletIcon,
    },
    {
      section: "spot-deposits",
      href: ProfileRoutes.deposits,
      label: t("profile.spotDepositHistory"),
      icon: DownloadIcon,
    },
    {
      section: "spot-withdrawals",
      href: ProfileRoutes.withdrawals,
      label: t("profile.spotWithdrawHistory"),
      icon: UploadIcon,
    },
  ];

  const isSpotSection = section.startsWith("spot-");

  return (
    <PageShell className={profilePageShellClass}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-0">
        <nav
          className="bg-muted/40 mx-3 mt-4 flex shrink-0 flex-col gap-1 rounded-xl p-2 sm:mx-4 lg:m-0 lg:flex-[2] lg:self-stretch lg:rounded-none lg:p-3"
          aria-label={t("profile.title")}
        >
          <Link
            href={ProfileRoutes.dashboard}
            aria-current={section === "dashboard" ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
              "hover:bg-muted/60",
              section === "dashboard"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboardIcon className="size-4 shrink-0" aria-hidden />
            {t("profile.dashboard")}
          </Link>

          <div className="mt-1 flex flex-col gap-0.5">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium",
                isSpotSection ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <LineChartIcon className="size-4 shrink-0" aria-hidden />
              {t("profile.spot")}
            </div>
            {spotSubItems.map(({ section: itemSection, href, label, icon: Icon }) => {
              const active = section === itemSection;
              return (
                <Link
                  key={itemSection}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex w-full items-center gap-2 rounded-xl py-2.5 pr-3 pl-6 text-left text-sm font-medium transition-colors",
                    "hover:bg-muted/60",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-col lg:flex-[8]">
          <ProfileOnChainWalletBar />
          <div className="flex min-h-0 flex-1 flex-col px-3 pt-4 pb-8 sm:px-4 lg:px-6 lg:pt-6">
            {children}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
