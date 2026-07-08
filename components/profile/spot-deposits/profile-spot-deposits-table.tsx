"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { ProfilePaginatedTableSection } from "@/components/profile/shared/profile-paginated-table-section";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBalance } from "@/lib/utils/format/balance";
import { shortTokenAddress } from "@/lib/utils/format/address";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import { useProfilePagination } from "@/lib/profile/use-profile-pagination";
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

type SymbolFilter = string | "all";
type DepositStatusFilter = DepositStatus | "all";

function TokenIcon({ symbol }: { symbol: string }) {
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

function DepositRow({ row }: { row: DepositsRsp }) {
  const { t } = useI18n();
  const status = row.status as DepositStatus;

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-2.5">
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
  const pagination = useProfilePagination();

  const { data: balancesList } = useUserBalancesList({ enabled: isAuthenticated });

  const symbolOptions = useMemo(() => {
    const balances = balancesList ?? [];
    return [...new Set(balances.map((balance) => balance.symbol))].sort();
  }, [balancesList]);

  const paginationReq = useMemo(
    () => ({
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      condition: {
        ...(symbolFilter !== "all" ? { symbol: symbolFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
    }),
    [pagination.currentPage, pagination.pageSize, symbolFilter, statusFilter]
  );

  const { data, isLoading, isFetching } = useDepositsPagination(paginationReq, {
    enabled: isAuthenticated,
  });

  const rows = data?.pageItems ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasFilters = symbolFilter !== "all" || statusFilter !== "all";
  const showFilters =
    isAuthenticated && (symbolOptions.length > 0 || totalCount > 0 || hasFilters);

  function handleSymbolFilterChange(value: string) {
    setSymbolFilter(value);
    pagination.resetPage();
  }

  function handleStatusFilterChange(value: DepositStatusFilter) {
    setStatusFilter(value);
    pagination.resetPage();
  }

  return (
    <ProfilePaginatedTableSection
      title={t("profile.spotDepositHistory")}
      showFilters={showFilters}
      isLoading={isLoading}
      totalCount={totalCount}
      hasRows={rows.length > 0}
      hasFilters={hasFilters}
      emptyMessage={t("profile.spotDepositHistoryEmpty")}
      footerColSpan={6}
      pageJumpId="deposit-page-jump"
      footerProps={pagination.buildFooterProps({
        totalPage: data?.totalPage ?? 0,
        totalCount,
        isFetching,
      })}
      filters={
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
      }
      header={
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
      }
    >
      <TableBody>
        {rows.map((row, index) => (
          <DepositRow key={`${row.tokenAddress}-${row.fromAddress}-${row.confirmedAt ?? index}`} row={row} />
        ))}
      </TableBody>
    </ProfilePaginatedTableSection>
  );
}
