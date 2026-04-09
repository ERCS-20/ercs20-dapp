"use client";

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
        openAccountModal,
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
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex max-w-[9rem] truncate rounded-full px-3.5 py-1.5 text-xs font-medium sm:max-w-[11rem] sm:px-4 sm:py-2 sm:text-sm"
            onClick={openAccountModal}
          >
            <span className="truncate">{account.displayName}</span>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
