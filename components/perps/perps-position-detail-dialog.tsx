"use client";

import { CalendarClockIcon, CandlestickChartIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatLeveragePairSuffix,
  ordersTradeHistoryRspToRow,
} from "@/lib/perps/open-orders-format";
import {
  cashLedgerAmount,
  formatSignedQuote,
  fundingPaymentAmount,
  fundingPeriodLabel,
  marginEventAmount,
  positionEventTypeLabel,
  signedAmountClass,
} from "@/lib/perps/position-detail-format";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import {
  useFundingSettlementsList,
  useOrdersTradeHistoryList,
  usePositionCashLedgerList,
  usePositionMarginEventsList,
} from "@/services/perps/orders/hooks";
import type { PerpsPositionEventsListReq } from "@/services/perps/orders/types";

export type PositionDetailTarget = {
  pairLabel: string;
  pairId: number;
  account?: string;
  positionId?: number;
  openedAt: number;
  closedAt?: number;
};

type DetailTab = "ledger" | "fills" | "margin" | "funding";

export function PerpsPositionDetailDialog({
  target,
  onOpenChange,
}: {
  target: PositionDetailTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<DetailTab>("ledger");
  const open = target != null;

  const timeReq = useMemo(
    (): PerpsPositionEventsListReq => ({
      pairId: target?.pairId ?? 0,
      account: (target?.account ?? "").toLowerCase(),
      fromBlockTimestamp: target?.openedAt ?? 0,
      toBlockTimestamp: target?.closedAt ?? Date.now(),
    }),
    [target?.pairId, target?.account, target?.openedAt, target?.closedAt]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTab("ledger");
        onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(
          "flex w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
          "rounded-2xl ring-1 ring-border/60 sm:max-w-4xl",
          "max-h-[min(90vh,640px)]"
        )}
      >
        <div className="border-border/60 bg-brand/5 border-b px-5 pt-5 pb-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/20">
              <CandlestickChartIcon aria-hidden className="size-5" />
            </div>
            <DialogHeader className="min-w-0 flex-1 gap-1.5 text-left sm:place-items-start">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t("perps.positionDetails")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {target?.pairLabel ?? "—"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
          {target ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <MetaCard label={t("perps.openedAt")} value={formatUtcDateTime(target.openedAt)} />
              {target.closedAt ? (
                <MetaCard label={t("perps.closedAt")} value={formatUtcDateTime(target.closedAt)} />
              ) : (
                <MetaCard label={t("perps.closedAt")} value={t("perps.positionOpen")} muted />
              )}
            </div>
          ) : null}

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as DetailTab)}
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            <TabsList className="h-9 w-full">
              <TabsTrigger
                value="ledger"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("ledger")}
              >
                {t("perps.tabTransactionLog")}
              </TabsTrigger>
              <TabsTrigger
                value="fills"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("fills")}
              >
                {t("perps.tabFills")}
              </TabsTrigger>
              <TabsTrigger
                value="margin"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("margin")}
              >
                {t("perps.tabMarginHistory")}
              </TabsTrigger>
              <TabsTrigger
                value="funding"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("funding")}
              >
                {t("perps.tabFundingHistory")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "ledger" ? (
                <LedgerPane positionId={target?.positionId} />
              ) : null}
            </TabsContent>
            <TabsContent value="fills" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "fills" ? <FillsPane req={timeReq} /> : null}
            </TabsContent>
            <TabsContent value="margin" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "margin" ? <MarginPane req={timeReq} /> : null}
            </TabsContent>
            <TabsContent value="funding" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "funding" ? <FundingPane req={timeReq} /> : null}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2.5 rounded-b-2xl border-t border-border/60 bg-muted/30 px-5 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl sm:w-auto sm:min-w-28"
            onClick={() => onOpenChange(false)}
          >
            {t("perps.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LedgerPane({ positionId }: { positionId?: number }) {
  const { t } = useI18n();
  const query = usePositionCashLedgerList(
    { positionId: positionId ?? 0 },
    { enabled: Boolean(positionId) }
  );
  return (
    <LedgerTable
      rows={query.data ?? []}
      isLoading={query.isFetching}
      empty={t("perps.emptyPositionLedger")}
      loadingText={t("swap.loading")}
      t={t}
    />
  );
}

function FillsPane({ req }: { req: PerpsPositionEventsListReq }) {
  const { t } = useI18n();
  const query = useOrdersTradeHistoryList(req, { enabled: true });
  const rows = useMemo(
    () => (query.data ?? []).map(ordersTradeHistoryRspToRow),
    [query.data]
  );
  return (
    <FillsTable
      rows={rows}
      isLoading={query.isFetching}
      empty={t("perps.emptyPositionFills")}
      loadingText={t("swap.loading")}
      t={t}
    />
  );
}

function MarginPane({ req }: { req: PerpsPositionEventsListReq }) {
  const { t } = useI18n();
  const query = usePositionMarginEventsList(req, { enabled: true });
  return (
    <MarginTable
      rows={query.data ?? []}
      isLoading={query.isFetching}
      empty={t("perps.emptyMarginHistory")}
      loadingText={t("swap.loading")}
      t={t}
    />
  );
}

function FundingPane({ req }: { req: PerpsPositionEventsListReq }) {
  const { t } = useI18n();
  const query = useFundingSettlementsList(req, { enabled: true });
  return (
    <FundingTable
      rows={query.data ?? []}
      isLoading={query.isFetching}
      empty={t("perps.emptyFundingHistory")}
      loadingText={t("swap.loading")}
      t={t}
    />
  );
}

function MetaCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-muted/50 border-border/60 flex items-center gap-3 rounded-2xl border p-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20">
        <CalendarClockIcon aria-hidden className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p
          className={cn(
            "mt-0.5 truncate text-sm font-semibold",
            muted ? "text-muted-foreground" : "text-foreground font-mono tabular-nums"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/60 bg-muted/30 h-full min-h-[14rem] overflow-auto rounded-2xl border">
      {children}
    </div>
  );
}

function PanelStatus({ message }: { message: string }) {
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 px-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60">
        <CandlestickChartIcon aria-hidden className="size-5" />
      </div>
      <p className="text-muted-foreground text-center text-xs leading-relaxed sm:text-sm">
        {message}
      </p>
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2.5 p-3.5">
      <p className="sr-only">{label}</p>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="bg-muted/80 h-10 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

function NumericHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground h-9 bg-muted/40 px-3 text-right text-xs font-medium",
        className
      )}
    >
      {children}
    </TableHead>
  );
}

function TextHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground h-9 bg-muted/40 px-3 text-left text-xs font-medium",
        className
      )}
    >
      {children}
    </TableHead>
  );
}

function LedgerTable({
  rows,
  isLoading,
  empty,
  loadingText,
  t,
}: {
  rows: NonNullable<ReturnType<typeof usePositionCashLedgerList>["data"]>;
  isLoading: boolean;
  empty: string;
  loadingText: string;
  t: (key: string) => string;
}) {
  return (
    <PanelShell>
      {isLoading ? (
        <PanelSkeleton label={loadingText} />
      ) : rows.length === 0 ? (
        <PanelStatus message={empty} />
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TextHead>{t("perps.time")}</TextHead>
              <TextHead>{t("perps.ledgerType")}</TextHead>
              <NumericHead>{t("perps.amount")}</NumericHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const amount = cashLedgerAmount(row);
              return (
                <TableRow key={`${row.positionId}-${row.refType}-${row.refId}-${i}`}>
                  <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {formatUtcDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm">
                    {positionEventTypeLabel(t, row.entryType)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-3 py-2.5 text-right text-sm font-medium tabular-nums",
                      signedAmountClass(amount)
                    )}
                  >
                    {formatSignedQuote(amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}

function FillsTable({
  rows,
  isLoading,
  empty,
  loadingText,
  t,
}: {
  rows: ReturnType<typeof ordersTradeHistoryRspToRow>[];
  isLoading: boolean;
  empty: string;
  loadingText: string;
  t: (key: string) => string;
}) {
  return (
    <PanelShell>
      {isLoading ? (
        <PanelSkeleton label={loadingText} />
      ) : rows.length === 0 ? (
        <PanelStatus message={empty} />
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TextHead>{t("perps.time")}</TextHead>
              <TextHead>{t("perps.side")}</TextHead>
              <NumericHead>{t("perps.price")}</NumericHead>
              <NumericHead>{t("perps.filled")}</NumericHead>
              <NumericHead>{t("perps.marginRequired")}</NumericHead>
              <NumericHead>{t("perps.fee")}</NumericHead>
              <TextHead className="text-right">{t("perps.role")}</TextHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={`${row.orderId}-${row.tradeTime}-${i}`}>
                <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                  {formatUtcDateTime(row.tradeTime)}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium",
                    row.placeSide === "buy"
                      ? "text-brand"
                      : row.placeSide === "sell"
                        ? "text-brand-alt"
                        : "text-muted-foreground"
                  )}
                >
                  {row.placeSide === "buy"
                    ? t("perps.buy")
                    : row.placeSide === "sell"
                      ? t("perps.sell")
                      : "—"}
                  <span className="text-muted-foreground font-normal">
                    {formatLeveragePairSuffix(row.leverage)}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {formatQuoteAmount(row.filledValue)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {row.lockedMargin != null ? formatQuoteAmount(row.lockedMargin) : "—"}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {row.fee > 0 ? formatQuoteAmount(row.fee) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground px-3 py-2.5 text-right text-xs">
                  {row.matchedSide === "maker"
                    ? t("perps.roleMaker")
                    : row.matchedSide === "taker"
                      ? t("perps.roleTaker")
                      : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}

function MarginTable({
  rows,
  isLoading,
  empty,
  loadingText,
  t,
}: {
  rows: NonNullable<ReturnType<typeof usePositionMarginEventsList>["data"]>;
  isLoading: boolean;
  empty: string;
  loadingText: string;
  t: (key: string) => string;
}) {
  return (
    <PanelShell>
      {isLoading ? (
        <PanelSkeleton label={loadingText} />
      ) : rows.length === 0 ? (
        <PanelStatus message={empty} />
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TextHead>{t("perps.time")}</TextHead>
              <TextHead>{t("perps.ledgerType")}</TextHead>
              <NumericHead>{t("perps.amount")}</NumericHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const amount = marginEventAmount(row);
              return (
                <TableRow key={`${row.pairId}-${row.blockNumber}-${row.blockLogIndex}-${i}`}>
                  <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {formatUtcDateTime(row.blockTimestamp)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm">
                    {positionEventTypeLabel(t, row.eventType)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-3 py-2.5 text-right text-sm font-medium tabular-nums",
                      signedAmountClass(amount)
                    )}
                  >
                    {formatSignedQuote(amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}

function FundingTable({
  rows,
  isLoading,
  empty,
  loadingText,
  t,
}: {
  rows: NonNullable<ReturnType<typeof useFundingSettlementsList>["data"]>;
  isLoading: boolean;
  empty: string;
  loadingText: string;
  t: (key: string) => string;
}) {
  return (
    <PanelShell>
      {isLoading ? (
        <PanelSkeleton label={loadingText} />
      ) : rows.length === 0 ? (
        <PanelStatus message={empty} />
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TextHead>{t("perps.time")}</TextHead>
              <TextHead>{t("perps.period")}</TextHead>
              <NumericHead>{t("perps.funding")}</NumericHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const amount = fundingPaymentAmount(row);
              return (
                <TableRow key={`${row.pairId}-${row.blockNumber}-${row.blockLogIndex}-${i}`}>
                  <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {formatUtcDateTime(row.blockTimestamp)}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {fundingPeriodLabel(row)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-3 py-2.5 text-right text-sm font-medium tabular-nums",
                      signedAmountClass(amount)
                    )}
                  >
                    {formatSignedQuote(amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}
