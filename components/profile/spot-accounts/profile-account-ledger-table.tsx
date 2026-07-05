"use client";

import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignedBalanceDelta } from "@/lib/utils/format/balance";
import { shortRefId } from "@/lib/utils/format/address";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { getMockAccountLedger } from "@/lib/profile/mock-account-ledger";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import type {
  AccountLedgerBizSubType,
  AccountLedgerBizType,
  AccountLedgerRsp,
} from "@/services/asset/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const BIZ_TYPES: AccountLedgerBizType[] = ["Deposit", "Withdraw", "Order"];

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

function bizTypeLabel(t: (k: string) => string, bizType: AccountLedgerBizType): string {
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

function bizSubTypeLabel(
  t: (k: string) => string,
  bizSubType: AccountLedgerBizSubType
): string {
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
      <TableCell>
        <span className="font-mono text-xs" title={row.refId}>
          {shortRefId(row.refId)}
        </span>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate text-muted-foreground text-xs">
        {row.remark ?? "—"}
      </TableCell>
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
  const rows = useMemo(() => getMockAccountLedger(tokenAddress), [tokenAddress]);
  const [bizFilter, setBizFilter] = useState<BizFilter>("all");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");

  const subTypeOptions = useMemo(() => {
    const pool = bizFilter === "all" ? rows : rows.filter((r) => r.bizType === bizFilter);
    return [...new Set(pool.map((r) => r.bizSubType))].sort();
  }, [rows, bizFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (bizFilter !== "all" && row.bizType !== bizFilter) return false;
      if (subFilter !== "all" && row.bizSubType !== subFilter) return false;
      return true;
    });
  }, [rows, bizFilter, subFilter]);

  function handleBizFilterChange(value: string) {
    const next = value as BizFilter;
    setBizFilter(next);
    if (subFilter !== "all") {
      const pool = next === "all" ? rows : rows.filter((r) => r.bizType === next);
      if (!pool.some((r) => r.bizSubType === subFilter)) {
        setSubFilter("all");
      }
    }
  }

  return (
    <section className="border-border/60 bg-card mt-4 rounded-2xl border p-5 sm:mt-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-foreground text-base font-medium">{t("profile.accountLedger")}</h3>
        {rows.length > 0 && (
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
                onChange={(e) => setSubFilter(e.target.value as SubFilter)}
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
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("profile.accountLedgerEmpty")}</p>
      ) : (
        <>
          {filteredRows.length === 0 ? (
            <p className="text-muted-foreground mt-6 text-sm">{t("profile.accountLedgerFilterEmpty")}</p>
          ) : (
            <div className="mt-4">
              <Table className="min-w-[44rem]">
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
                      {t("profile.ledgerRefId")}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      {t("profile.ledgerRemark")}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      {t("profile.createdAt")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, index) => (
                    <LedgerRow
                      key={`${row.refId}-${row.bizSubType}-${index}`}
                      row={row}
                      symbol={symbol}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
