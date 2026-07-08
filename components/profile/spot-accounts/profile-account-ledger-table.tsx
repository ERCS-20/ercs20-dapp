"use client";

import { useMemo, useState } from "react";

import { ProfilePaginatedTableSection } from "@/components/profile/shared/profile-paginated-table-section";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignedBalanceDelta } from "@/lib/utils/format/balance";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import { useProfilePagination } from "@/lib/profile/use-profile-pagination";
import type {
  AccountLedgerBizSubType,
  AccountLedgerBizType,
} from "@/services/asset/types";
import { useAccountLedgerPagination } from "@/services/spot/accounts/hooks";
import type { AccountLedgerRsp } from "@/services/spot/accounts/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const BIZ_TYPES: AccountLedgerBizType[] = ["Deposit", "Withdraw", "Order"];

const SUB_TYPES_BY_BIZ: Record<AccountLedgerBizType, AccountLedgerBizSubType[]> = {
  Deposit: ["Deposit"],
  Withdraw: ["WithdrawFrozen", "WithdrawUnfrozen"],
  Order: ["OrderFrozen", "OrderUnfrozen", "OrderDeduct", "OrderCredit", "OrderFee"],
};

const ALL_SUB_TYPES: AccountLedgerBizSubType[] = [
  "Deposit",
  "WithdrawFrozen",
  "WithdrawUnfrozen",
  "OrderFrozen",
  "OrderUnfrozen",
  "OrderDeduct",
  "OrderCredit",
  "OrderFee",
];

type BizFilter = AccountLedgerBizType | "all";
type SubFilter = AccountLedgerBizSubType | "all";

function deltaTone(raw: string): string {
  try {
    const v = BigInt(raw);
    if (v > BigInt(0)) return "text-brand";
    if (v < BigInt(0)) return "text-brand-alt";
    return "text-muted-foreground";
  } catch {
    return "text-foreground";
  }
}

function bizTypeLabel(t: (k: string) => string, bizType: string): string {
  switch (bizType) {
    case "Deposit":
      return t("profile.ledgerBizDeposit");
    case "Withdraw":
      return t("profile.ledgerBizWithdraw");
    case "Order":
      return t("profile.ledgerBizOrder");
    default:
      return bizType;
  }
}

function bizSubTypeLabel(t: (k: string) => string, bizSubType: string): string {
  switch (bizSubType) {
    case "Deposit":
      return t("profile.ledgerBizSubDeposit");
    case "WithdrawFrozen":
      return t("profile.ledgerBizSubWithdrawFrozen");
    case "WithdrawUnfrozen":
      return t("profile.ledgerBizSubWithdrawUnfrozen");
    case "OrderFrozen":
      return t("profile.ledgerBizSubOrderFrozen");
    case "OrderUnfrozen":
      return t("profile.ledgerBizSubOrderUnfrozen");
    case "OrderDeduct":
      return t("profile.ledgerBizSubOrderDeduct");
    case "OrderCredit":
      return t("profile.ledgerBizSubOrderCredit");
    case "OrderFee":
      return t("profile.ledgerBizSubOrderFee");
    default:
      return bizSubType;
  }
}

function LedgerRow({ row, symbol }: { row: AccountLedgerRsp; symbol: string }) {
  const { t } = useI18n();

  return (
    <TableRow>
      <TableCell className={cn("tabular-nums", deltaTone(row.deltaAvailable))}>
        {formatSignedBalanceDelta(row.deltaAvailable, symbol)}
      </TableCell>
      <TableCell className={cn("tabular-nums", deltaTone(row.deltaFrozen))}>
        {formatSignedBalanceDelta(row.deltaFrozen, symbol)}
      </TableCell>
      <TableCell>{bizTypeLabel(t, row.bizType)}</TableCell>
      <TableCell>{bizSubTypeLabel(t, row.bizSubType)}</TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatUtcDateTime(row.createdAt)}
      </TableCell>
    </TableRow>
  );
}

export function ProfileAccountLedgerTable({
  tokenAddress,
  symbol,
}: {
  tokenAddress: string;
  symbol: string;
}) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [bizFilter, setBizFilter] = useState<BizFilter>("all");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");
  const pagination = useProfilePagination();

  const subTypeOptions = useMemo(() => {
    if (bizFilter === "all") return ALL_SUB_TYPES;
    return SUB_TYPES_BY_BIZ[bizFilter];
  }, [bizFilter]);

  const paginationReq = useMemo(
    () => ({
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      condition: {
        tokenAddress,
        ...(bizFilter !== "all" ? { bizType: bizFilter } : {}),
        ...(subFilter !== "all" ? { bizSubType: subFilter } : {}),
      },
    }),
    [pagination.currentPage, pagination.pageSize, tokenAddress, bizFilter, subFilter]
  );

  const { data, isLoading, isFetching } = useAccountLedgerPagination(paginationReq, {
    enabled: isAuthenticated,
  });

  const rows = data?.pageItems ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasFilters = bizFilter !== "all" || subFilter !== "all";
  const showFilters = isAuthenticated && (totalCount > 0 || hasFilters);

  function handleBizFilterChange(value: string) {
    const next = value as BizFilter;
    setBizFilter(next);
    if (subFilter !== "all") {
      const pool = next === "all" ? ALL_SUB_TYPES : SUB_TYPES_BY_BIZ[next];
      if (!pool.includes(subFilter)) {
        setSubFilter("all");
      }
    }
    pagination.resetPage();
  }

  function handleSubFilterChange(value: SubFilter) {
    setSubFilter(value);
    pagination.resetPage();
  }

  return (
    <ProfilePaginatedTableSection
      title={t("profile.accountLedger")}
      showFilters={showFilters}
      isLoading={isLoading}
      totalCount={totalCount}
      hasRows={rows.length > 0}
      hasFilters={hasFilters}
      emptyMessage={t("profile.accountLedgerEmpty")}
      footerColSpan={5}
      pageJumpId="ledger-page-jump"
      footerProps={pagination.buildFooterProps({
        totalPage: data?.totalPage ?? 0,
        totalCount,
        isFetching,
      })}
      filters={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 text-xs">
              {t("profile.ledgerBizType")}
            </span>
            <select
              className={profileTableFilterSelectClass}
              value={bizFilter}
              onChange={(e) => handleBizFilterChange(e.target.value)}
              aria-label={t("profile.ledgerBizType")}
            >
              <option value="all">{t("profile.ledgerFilterAll")}</option>
              {BIZ_TYPES.map((biz) => (
                <option key={biz} value={biz}>
                  {bizTypeLabel(t, biz)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 text-xs">
              {t("profile.ledgerBizSubType")}
            </span>
            <select
              className={profileTableFilterSelectClass}
              value={subFilter}
              onChange={(e) => handleSubFilterChange(e.target.value as SubFilter)}
              aria-label={t("profile.ledgerBizSubType")}
            >
              <option value="all">{t("profile.ledgerFilterAll")}</option>
              {subTypeOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {bizSubTypeLabel(t, sub)}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      header={
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs">
              {t("profile.ledgerDeltaAvailable")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("profile.ledgerDeltaFrozen")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("profile.ledgerBizType")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("profile.ledgerBizSubType")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("profile.createdAt")}
            </TableHead>
          </TableRow>
        </TableHeader>
      }
    >
      <TableBody>
        {rows.map((row, index) => (
          <LedgerRow
            key={`${row.refId}-${row.bizSubType}-${index}`}
            row={row}
            symbol={symbol}
          />
        ))}
      </TableBody>
    </ProfilePaginatedTableSection>
  );
}
