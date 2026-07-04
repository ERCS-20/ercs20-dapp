"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProfileBalance, shortTokenAddress } from "@/lib/profile/format";
import { getMockUserBalances } from "@/lib/profile/mock-user-balances";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { UserBalanceRsp, UserBalanceStatus } from "@/services/asset/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

function TokenBalanceIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border/60"
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
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-full ring-1 ring-border/60"
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

function BalanceRow({ row }: { row: UserBalanceRsp }) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-3">
          <TokenBalanceIcon symbol={row.symbol} />
          <div className="min-w-0">
            <p className="text-foreground truncate font-medium">{row.name}</p>
            <p
              className="text-muted-foreground mt-0.5 truncate font-mono text-xs"
              title={row.tokenAddress}
            >
              {shortTokenAddress(row.tokenAddress)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-brand tabular-nums">
        {formatProfileBalance(row.availableBalance)} {row.symbol}
      </TableCell>
      <TableCell className="text-brand-alt tabular-nums">
        {formatProfileBalance(row.frozenBalance)} {row.symbol}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg px-2.5 text-xs"
          asChild
        >
          <Link href={`/profile/accounts/${encodeURIComponent(row.tokenAddress)}`}>
            {t("profile.details")}
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ProfileSpotBalancesTable({
  titleKey = "profile.accounts",
  emptyKey = "profile.emptySpotBalances",
  balances: balancesProp,
}: {
  titleKey?: string;
  emptyKey?: string;
  balances?: UserBalanceRsp[];
}) {
  const { t } = useI18n();
  const balances = useMemo(
    () => balancesProp ?? getMockUserBalances(),
    [balancesProp]
  );

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <h2 className="text-foreground text-base font-medium">{t(titleKey)}</h2>

      {balances.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t(emptyKey)}</p>
      ) : (
        <div className="mt-4">
          <Table className="min-w-[32rem] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">{t("profile.asset")}</TableHead>
                <TableHead className="text-muted-foreground w-[10rem] text-xs">
                  {t("profile.availableBalance")}
                </TableHead>
                <TableHead className="text-muted-foreground w-[10rem] text-xs">
                  {t("profile.frozenBalance")}
                </TableHead>
                <TableHead className="text-muted-foreground w-[5.5rem] text-xs">
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
