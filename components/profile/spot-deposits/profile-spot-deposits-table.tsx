"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBalance } from "@/lib/utils/format/balance";
import { shortTokenAddress } from "@/lib/utils/format/address";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import {
  depositStatusBadgeClass,
  depositStatusLabel,
} from "@/lib/profile/transfer-status";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { DepositStatus } from "@/services/asset/types";
import { useDepositsPagination, useUserBalancesList } from "@/services/spot/accounts/hooks";
import type { DepositsRsp } from "@/services/spot/accounts/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const DEPOSIT_STATUSES: DepositStatus[] = ["Pending", "Success"];
const PAGE_SIZE = 20;

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

function DepositRow({ row }: { row: DepositsRsp }) {
  const { t } = useI18n();
  const status = row.status as DepositStatus;

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
        {formatBalance(row.amount)} {row.symbol}
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs" title={row.fromAddress}>
          {shortTokenAddress(row.fromAddress)}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs" title={row.toAddress}>
          {shortTokenAddress(row.toAddress)}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            depositStatusBadgeClass(status)
          )}
        >
          {depositStatusLabel(t, status)}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {row.confirmedAt ? formatUtcDateTime(row.confirmedAt) : "—"}
      </TableCell>
    </TableRow>
  );
}

export function ProfileSpotDepositsTable() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [symbolFilter, setSymbolFilter] = useState<SymbolFilter>("all");
  const [statusFilter, setStatusFilter] = useState<DepositStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: balancesList } = useUserBalancesList({ enabled: isAuthenticated });

  const symbolOptions = useMemo(() => {
    const balances = balancesList ?? [];
    return [...new Set(balances.map((balance) => balance.symbol))].sort();
  }, [balancesList]);

  const paginationReq = useMemo(
    () => ({
      currentPage,
      pageSize: PAGE_SIZE,
      condition: {
        ...(symbolFilter !== "all" ? { symbol: symbolFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
    }),
    [currentPage, symbolFilter, statusFilter]
  );

  const { data, isLoading, isFetching } = useDepositsPagination(paginationReq, {
    enabled: isAuthenticated,
  });

  const rows = data?.pageItems ?? [];
  const totalPage = data?.totalPage ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const pageTotal = Math.max(totalPage, 1);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);
  const hasFilters = symbolFilter !== "all" || statusFilter !== "all";
  const showFilters = isAuthenticated && (symbolOptions.length > 0 || totalCount > 0 || hasFilters);

  function handleSymbolFilterChange(value: string) {
    setSymbolFilter(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: DepositStatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-medium">{t("profile.spotDepositHistory")}</h2>
        {showFilters && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0 text-xs">{t("profile.symbol")}</span>
              <select
                className={profileTableFilterSelectClass}
                value={symbolFilter}
                onChange={(e) => handleSymbolFilterChange(e.target.value)}
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
                onChange={(e) => handleStatusFilterChange(e.target.value as DepositStatusFilter)}
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

      {!isAuthenticated ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.spotDepositHistoryEmpty")}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("swap.loading")}</p>
      ) : totalCount === 0 && !hasFilters ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.spotDepositHistoryEmpty")}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.accountLedgerFilterEmpty")}</p>
      ) : (
        <div className="mt-4">
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">{t("profile.asset")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.amount")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.fromAddress")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.toAddress")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.balanceStatus")}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t("profile.confirmedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <DepositRow key={`${row.tokenAddress}-${row.fromAddress}-${row.confirmedAt ?? index}`} row={row} />
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={6} className="px-2 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>
                        {t("profile.paginationTotal")
                          .replace("{total}", String(totalCount))}
                      </span>
                      <span className="bg-border/70 hidden h-3 w-px sm:inline-block" aria-hidden />
                      <span>
                        {t("profile.paginationRange")
                          .replace("{start}", String(rangeStart))
                          .replace("{end}", String(rangeEnd))}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span className="text-muted-foreground text-xs">
                        {t("profile.paginationPageOf")
                          .replace("{current}", String(currentPage))
                          .replace("{total}", String(pageTotal))}
                      </span>
                      <div className="border-border/60 bg-background flex items-center rounded-lg border p-0.5 shadow-sm">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 rounded-md"
                          disabled={currentPage <= 1 || isFetching}
                          aria-label={t("profile.paginationPrev")}
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        >
                          <ChevronLeftIcon />
                        </Button>
                        <span className="text-foreground min-w-12 px-1 text-center text-xs font-medium tabular-nums">
                          {currentPage}
                          <span className="text-muted-foreground mx-0.5 font-normal">/</span>
                          {pageTotal}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 rounded-md"
                          disabled={currentPage >= pageTotal || isFetching}
                          aria-label={t("profile.paginationNext")}
                          onClick={() => setCurrentPage((page) => Math.min(pageTotal, page + 1))}
                        >
                          <ChevronRightIcon />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </section>
  );
}
