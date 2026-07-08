"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBalance } from "@/lib/utils/format/balance";
import { shortTokenAddress } from "@/lib/utils/format/address";
import { profileTableClass, profileTableSectionClass, profileTableWrapClass } from "@/lib/profile/table-filters";
import { ProfileRoutes } from "@/lib/profile/routes";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { useUserBalancesList } from "@/services/spot/accounts/hooks";
import type { UserBalancesRsp } from "@/services/spot/accounts/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

function TokenBalanceIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-border/60"
        aria-hidden
      >
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-border/60"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function statusLabel(t: (k: string) => string, status: string): string {
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

function statusBadgeClass(status: string): string {
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

function BalanceRow({ row }: { row: UserBalancesRsp }) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-2.5">
          <TokenBalanceIcon symbol={row.symbol} />
          <div className="min-w-0">
            <p className="text-foreground truncate font-medium">{row.symbol}</p>
            <p
              className="text-muted-foreground mt-0.5 truncate font-mono text-xs"
              title={row.tokenAddress}
            >
              {shortTokenAddress(row.tokenAddress)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-brand min-w-[7.5rem] max-w-[11rem] tabular-nums">
        <span className="block truncate" title={`${formatBalance(row.availableBalance)} ${row.symbol}`}>
          {formatBalance(row.availableBalance)} {row.symbol}
        </span>
      </TableCell>
      <TableCell className="text-brand-alt min-w-[7.5rem] max-w-[11rem] tabular-nums">
        <span className="block truncate" title={`${formatBalance(row.frozenBalance)} ${row.symbol}`}>
          {formatBalance(row.frozenBalance)} {row.symbol}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusBadgeClass(row.status)
          )}
        >
          {statusLabel(t, row.status)}
        </span>
      </TableCell>
      <TableCell>
        <Link
          href={ProfileRoutes.accountDetail(row.tokenAddress)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex h-8 rounded-lg px-2.5 text-xs"
          )}
        >
          {t("profile.details")}
        </Link>
      </TableCell>
    </TableRow>
  );
}

export function ProfileSpotBalancesTable({
  titleKey = "profile.accounts",
  emptyKey = "profile.emptySpotBalances",
}: {
  titleKey?: string;
  emptyKey?: string;
}) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useUserBalancesList({ enabled: isAuthenticated });

  const balances = data ?? [];

  return (
    <section className={profileTableSectionClass}>
      <h2 className="text-foreground text-base font-medium">{t(titleKey)}</h2>

      {!isAuthenticated ? (
        <p className="text-muted-foreground mt-6 text-sm">{t(emptyKey)}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("swap.loading")}</p>
      ) : balances.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t(emptyKey)}</p>
      ) : (
        <div className={profileTableWrapClass}>
          <Table className={profileTableClass}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground min-w-[10rem] text-xs">
                  {t("profile.asset")}
                </TableHead>
                <TableHead className="text-muted-foreground min-w-[7.5rem] text-xs">
                  {t("profile.availableBalance")}
                </TableHead>
                <TableHead className="text-muted-foreground min-w-[7.5rem] text-xs">
                  {t("profile.frozenBalance")}
                </TableHead>
                <TableHead className="text-muted-foreground min-w-[5.5rem] text-xs">
                  {t("profile.balanceStatus")}
                </TableHead>
                <TableHead className="text-muted-foreground w-[6rem] text-xs">
                  {t("profile.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((row) => (
                <BalanceRow key={`${row.tokenAddress}-${row.symbol}`} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
