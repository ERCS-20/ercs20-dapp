"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatProfileBalance,
  formatProfileDateTime,
  shortTokenAddress,
  shortTxHash,
} from "@/lib/profile/format";
import { getMockDeposits } from "@/lib/profile/mock-deposits";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import {
  depositStatusBadgeClass,
  depositStatusLabel,
} from "@/lib/profile/transfer-status";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { DepositRsp, DepositStatus } from "@/services/asset/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const DEPOSIT_STATUSES: DepositStatus[] = ["Pending", "Success"];

type SymbolFilter = string | "all";
type DepositStatusFilter = DepositStatus | "all";

function TokenIcon({ symbol }: { symbol: string }) {
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

function DepositRow({ row }: { row: DepositRsp }) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-3">
          <TokenIcon symbol={row.symbol} />
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
      <TableCell className="text-brand tabular-nums">
        {formatProfileBalance(row.amount)} {row.symbol}
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs" title={row.fromAddress}>
          {shortTokenAddress(row.fromAddress)}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            depositStatusBadgeClass(row.status)
          )}
        >
          {depositStatusLabel(t, row.status)}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatProfileDateTime(row.createdAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {row.confirmedAt ? formatProfileDateTime(row.confirmedAt) : "—"}
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs" title={row.txHash}>
          {shortTxHash(row.txHash)}
        </span>
      </TableCell>
    </TableRow>
  );
}

export function ProfileSpotDepositsTable() {
  const { t } = useI18n();
  const rows = useMemo(() => getMockDeposits(), []);
  const [symbolFilter, setSymbolFilter] = useState<SymbolFilter>("all");
  const [statusFilter, setStatusFilter] = useState<DepositStatusFilter>("all");

  const symbolOptions = useMemo(
    () => [...new Set(rows.map((r) => r.symbol))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (symbolFilter !== "all" && row.symbol !== symbolFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, symbolFilter, statusFilter]);

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-medium">{t("profile.spotDepositHistory")}</h2>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0 text-xs">{t("profile.symbol")}</span>
              <select
                className={profileTableFilterSelectClass}
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                aria-label={t("profile.symbol")}
              >
                <option value="all">{t("profile.ledgerFilterAll")}</option>
                {symbolOptions.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0 text-xs">
                {t("profile.balanceStatus")}
              </span>
              <select
                className={profileTableFilterSelectClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DepositStatusFilter)}
                aria-label={t("profile.balanceStatus")}
              >
                <option value="all">{t("profile.ledgerFilterAll")}</option>
                {DEPOSIT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {depositStatusLabel(t, status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.spotDepositHistoryEmpty")}</p>
      ) : filteredRows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.accountLedgerFilterEmpty")}</p>
      ) : (
        <div className="mt-4">
          <Table className="min-w-[48rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">{t("profile.asset")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.amount")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.fromAddress")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.balanceStatus")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.createdAt")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.confirmedAt")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.txHash")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <DepositRow key={`${row.txHash}-${row.createdAt}`} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
