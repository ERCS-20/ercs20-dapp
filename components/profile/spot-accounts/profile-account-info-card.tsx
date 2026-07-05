"use client";

import Image from "next/image";
import { useState } from "react";

import { formatBalance } from "@/lib/utils/format/balance";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { UserBalanceRsp, UserBalanceStatus } from "@/services/asset/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

function TokenIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-border/60"
        aria-hidden
      >
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={44}
      height={44}
      className="size-11 shrink-0 rounded-full ring-1 ring-border/60"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function statusLabel(t: (k: string) => string, status: UserBalanceStatus): string {
  switch (status) {
    case "Active":
      return t("profile.balanceStatusActive");
    case "Frozen":
      return t("profile.balanceStatusFrozen");
    case "Disabled":
      return t("profile.balanceStatusDisabled");
    default:
      return status;
  }
}

function statusBadgeClass(status: UserBalanceStatus): string {
  switch (status) {
    case "Active":
      return "border-brand text-brand";
    case "Frozen":
      return "border-brand-alt text-brand-alt";
    case "Disabled":
      return "border-brand-alt text-brand-alt";
    default:
      return "border-border text-foreground";
  }
}

export function ProfileAccountInfoCard({ account }: { account: UserBalanceRsp }) {
  const { t } = useI18n();

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <TokenIcon symbol={account.symbol} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground text-lg font-medium">{account.name}</h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusBadgeClass(account.status)
                )}
              >
                {statusLabel(t, account.status)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm" title={account.tokenAddress}>
              {account.tokenAddress}
            </p>
          </div>
        </div>
        <dl className="grid w-full shrink-0 gap-3 sm:w-auto sm:min-w-[14rem] sm:grid-cols-1">
          <div>
            <dt className="text-muted-foreground text-xs">{t("profile.availableBalance")}</dt>
            <dd className="text-brand mt-0.5 tabular-nums text-sm font-medium">
              {formatBalance(account.availableBalance)} {account.symbol}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">{t("profile.frozenBalance")}</dt>
            <dd className="text-brand-alt mt-0.5 tabular-nums text-sm font-medium">
              {formatBalance(account.frozenBalance)} {account.symbol}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
