"use client";

import Link from "next/link";
import { ChevronRightIcon, CircleUserIcon } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n-provider";

const pillClassName =
  "inline-flex rounded-full border-0 px-3.5 py-1.5 text-xs font-medium shadow-md shadow-primary/25 transition-[opacity,transform,box-shadow] duration-300 ease-out active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm dark:shadow-primary/20";

export function ConnectWalletButton() {
  const { t } = useI18n();

  return (
    <ConnectButton.Custom>
      {({
        account,
        mounted,
        openConnectModal,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        if (!ready) {
          return (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled
              className={`${pillClassName} opacity-60`}
            >
              {t("wallet.connect")}
            </Button>
          );
        }

        if (!account) {
          return (
            <Button
              type="button"
              variant="default"
              size="sm"
              className={pillClassName}
              onClick={openConnectModal}
            >
              {t("wallet.connect")}
            </Button>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="group inline-flex max-w-[12rem] gap-0 rounded-full px-2.5 py-1.5 transition-colors hover:bg-muted sm:max-w-[13rem] sm:px-3 sm:py-2"
            asChild
          >
            <Link
              href="/profile"
              title={t("wallet.viewProfile")}
              aria-label={t("wallet.viewProfile")}
              className="inline-flex min-w-0 items-center gap-1.5"
            >
              <CircleUserIcon className="size-3.5 shrink-0 opacity-70 sm:size-4" aria-hidden />
              <span className="min-w-0 truncate text-xs font-medium sm:text-sm">
                {account.displayName}
              </span>
              <ChevronRightIcon
                className="size-3.5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80 sm:size-4"
                aria-hidden
              />
            </Link>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
