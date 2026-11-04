"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PerpsPositionDetailDialog, type PositionDetailTarget } from "@/components/perps/perps-position-detail-dialog";
import {
  PerpsOrderDetailDialog,
  type OrderDetailTarget,
} from "@/components/perps/perps-order-detail-dialog";
import {
  PerpsAdjustMarginDialog,
  type AdjustMarginTarget,
} from "@/components/perps/perps-adjust-margin-dialog";
import {
  PerpsClosePositionDialog,
  type ClosePositionTarget,
} from "@/components/perps/perps-close-position-dialog";
import {
  formatLeveragePairSuffix,
  formatOrderHistoryStatus,
  ordersHistoryRspToRow,
  ordersRspToOpenOrderRow,
  type OpenOrderRow,
} from "@/lib/perps/open-orders-format";
import { formatEnginePrice, formatMarkPrice, type MarkPriceText } from "@/lib/perps/mark-price";
import { enginePriceToNumber } from "@/lib/market/engine-price-decimal";
import { positionsRspToRow, positionHistoryRspToRow } from "@/lib/perps/positions-format";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getCancelOrderSignTypedData } from "@/lib/perps/cancel-order-eip712";
import { isPerpsExchangeConfigured } from "@/lib/config/perps-exchange";
import {
  formatPercentChange,
  formatQuoteAmount,
  formatSubscriptPrice,
} from "@/lib/utils/price";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { getOrderSalt, getPerpsOrdersUserBalance } from "@/services/perps/orders/api";
import {
  useFundingIndexes,
  useMarketPositionPairs,
  useMarksByIds,
} from "@/services/perps/market/hooks";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { usePerpsOracleWs } from "@/services/perps/market/oracle-ws";
import {
  useCancelOrder,
  useOrdersHistoryPagination,
  useOrdersList,
  usePairsByIds,
  usePositionHistoryPagination,
  usePositionsList,
} from "@/services/perps/orders/hooks";

export type PerpsOrdersTab =
  | "positions"
  | "open"
  | "history"
  | "position-history";

const ORDERS_PAGE_SIZE = 50;

export function PerpsOrdersTabs({
  tab,
  onTabChange,
  baseSymbol,
  className,
}: {
  tab: PerpsOrdersTab;
  onTabChange: (t: PerpsOrdersTab) => void;
  baseSymbol: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [detailTarget, setDetailTarget] = useState<PositionDetailTarget | null>(null);
  const [orderDetailTarget, setOrderDetailTarget] = useState<OrderDetailTarget | null>(null);
  const [marginTarget, setMarginTarget] = useState<AdjustMarginTarget | null>(null);
  const [closeTarget, setCloseTarget] = useState<ClosePositionTarget | null>(null);
  const tabs: { id: PerpsOrdersTab; label: string }[] = [
    { id: "positions", label: t("perps.positions") },
    { id: "open", label: t("perps.openOrders") },
    { id: "history", label: t("perps.orderHistory") },
    { id: "position-history", label: t("perps.positionHistory") },
  ];

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-0 flex-col overflow-hidden rounded-xl border",
        className
      )}
    >
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as PerpsOrdersTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 overflow-x-auto pb-2">
          <TabsList className="h-9 w-full min-w-max rounded-none">
            {tabs.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="rounded-none px-3 text-xs sm:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
        {tab === "positions" && (
          <PositionsTable
            baseSymbol={baseSymbol}
            onDetails={setDetailTarget}
            onAdjustMargin={setMarginTarget}
            onClose={setCloseTarget}
          />
        )}
        {tab === "open" && (
          <OpenOrdersTable
            onOrderDetails={(row) =>
              setOrderDetailTarget({
                orderId: row.orderId,
                pairLabel: row.pairLabel,
              })
            }
          />
        )}
        {tab === "history" && (
          <HistoryOrdersTable
            onOrderDetails={(row) =>
              setOrderDetailTarget({
                orderId: row.orderId,
                pairLabel: row.pairLabel,
              })
            }
          />
        )}
        {tab === "position-history" && (
          <PositionHistoryTable
            onDetails={(row) =>
              setDetailTarget({
                pairLabel: row.pairLabel,
                pairId: row.pairId,
                account: row.account,
                positionId: Number(row.id),
                openedAt: row.openedAt,
                closedAt: row.closedAt,
              })
            }
          />
        )}
        </div>
      </Tabs>
      <PerpsPositionDetailDialog
        target={detailTarget}
        onOpenChange={(next) => {
          if (!next) setDetailTarget(null);
        }}
      />
      <PerpsOrderDetailDialog
        target={orderDetailTarget}
        onOpenChange={(next) => {
          if (!next) setOrderDetailTarget(null);
        }}
      />
      <PerpsAdjustMarginDialog
        target={marginTarget}
        onOpenChange={(next) => {
          if (!next) setMarginTarget(null);
        }}
      />
      <PerpsClosePositionDialog
        target={closeTarget}
        onOpenChange={(next) => {
          if (!next) setCloseTarget(null);
        }}
      />
    </section>
  );
}

const textCell = "px-3 py-2.5 text-sm";
const numericCell = "px-3 py-2.5 tabular-nums";
const timeCell = "text-muted-foreground px-3 py-2.5 text-sm tabular-nums";
const idCell = "text-muted-foreground px-3 py-2.5 text-xs tabular-nums";

function OrdersTableFrame({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-max text-sm">{children}</table>;
}

function OrdersTableHead({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="hover:bg-transparent">{children}</TableRow>
    </TableHeader>
  );
}

function TextHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground sticky top-0 z-10 h-9 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-3 text-left text-xs font-medium",
        className
      )}
    >
      {children}
    </TableHead>
  );
}

function NumericHead({ children }: { children: ReactNode }) {
  return <TextHead>{children}</TextHead>;
}

function OrdersTableMessageRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="text-muted-foreground px-3 py-8 text-center text-sm">
        {message}
      </TableCell>
    </TableRow>
  );
}

function resolveOrdersTableMessage({
  authReady,
  isAuthenticated,
  isLoading,
  isFetching,
  hasRows,
  loadingMessage,
  loginMessage,
  emptyMessage,
}: {
  authReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFetching: boolean;
  hasRows: boolean;
  loadingMessage: string;
  loginMessage: string;
  emptyMessage: string;
}): string | null {
  if (!authReady || (isAuthenticated && (isLoading || (isFetching && !hasRows)))) {
    return loadingMessage;
  }
  if (!isAuthenticated) return loginMessage;
  if (!hasRows) return emptyMessage;
  return null;
}

function usePositionPairQuotes(positions: { pairId: number }[] | undefined, settled: boolean) {
  const pairIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of positions ?? []) {
      if (Number.isInteger(row.pairId) && row.pairId >= 0) ids.add(row.pairId);
    }
    return [...ids].sort((a, b) => a - b);
  }, [positions]);

  const quotesEnabled = settled && pairIds.length > 0;
  usePerpsOracleWs(pairIds, quotesEnabled);
  const marksById = useMarksByIds(pairIds, { enabled: quotesEnabled });
  const fundingById = useFundingIndexes(pairIds, { enabled: quotesEnabled });
  const pairInfo = usePairsByIds(pairIds, { enabled: quotesEnabled });
  const { data: positionPairs } = useMarketPositionPairs(pairIds, {
    enabled: quotesEnabled,
    notifyError: false,
  });

  return useMemo(() => {
    const marks = new Map<number, MarkPriceText>();
    for (const [pairId, mark] of marksById) {
      const formatted = formatMarkPrice(mark, pairInfo.get(pairId)?.enginePriceDecimal);
      if (formatted != null) marks.set(pairId, formatted);
    }
    const closeById = new Map<number, ApiBigInt>();
    for (const row of positionPairs?.pairs ?? []) closeById.set(row.pairId, row.close);
    return { marks, marksById, fundingById, pairInfo, closeById };
  }, [fundingById, marksById, pairInfo, positionPairs]);
}

function PositionsTable({
  baseSymbol,
  onDetails,
  onAdjustMargin,
  onClose,
}: {
  baseSymbol: string;
  onDetails: (target: PositionDetailTarget) => void;
  onAdjustMargin: (target: AdjustMarginTarget) => void;
  onClose: (target: ClosePositionTarget) => void;
}) {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  const { data, isLoading, isFetching, isSuccess } = usePositionsList({
    enabled: isAuthenticated,
    notifyError: false,
  });
  const pairQuotes = usePositionPairQuotes(data, isSuccess);

  const rows = useMemo(
    () =>
      (data ?? []).map((pos) =>
        positionsRspToRow(pos, {
          fundingIndex: pairQuotes.fundingById.get(pos.pairId),
          minCollateralX18: pairQuotes.pairInfo.get(pos.pairId)?.minCollateralX18,
          markX18: pairQuotes.marksById.get(pos.pairId)?.markX18,
        })
      ),
    // `fundingById` changes when a newer `fundingIndex` push arrives, so break-even rebuilds with the list.
    [data, pairQuotes]
  );

  const colSpan = 11;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyPositions"),
  });

  return (
    <OrdersTableFrame>
      <OrdersTableHead>
        <TextHead>{t("perps.pair")}</TextHead>
        <TextHead>{t("perps.side")}</TextHead>
        <NumericHead>{t("perps.marginRequired")}</NumericHead>
        <NumericHead>{t("perps.sizeSymbol").replace("{symbol}", baseSymbol)}</NumericHead>
        <NumericHead>{t("perps.breakEvenPrice")}</NumericHead>
        <NumericHead>{t("perps.liqPrice")}</NumericHead>
        <NumericHead>{t("perps.markPrice")}</NumericHead>
        <NumericHead>{t("perps.pnl")}</NumericHead>
        <NumericHead>{t("perps.roi")}</NumericHead>
        <NumericHead>{t("perps.openedAt")}</NumericHead>
        <TextHead>{t("perps.action")}</TextHead>
      </OrdersTableHead>
      <TableBody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => {
            const mark = pairQuotes.marks.get(row.pairId);
            const markLabel = mark?.label ?? "—";
            return (
            <TableRow key={row.id}>
              <TableCell className={textCell}>
                {row.pairLabel}
                <span className="text-muted-foreground">{formatLeveragePairSuffix(row.leverage)}</span>
              </TableCell>
              <TableCell
                className={cn(
                  textCell,
                  "font-medium",
                  row.side ? sideClass(row.side) : "text-muted-foreground"
                )}
              >
                {row.side === "buy"
                  ? t("perps.long")
                  : row.side === "sell"
                    ? t("perps.short")
                    : "—"}
              </TableCell>
              <TableCell className={numericCell}>{formatQuoteAmount(row.margin)}</TableCell>
              <TableCell className={numericCell}>
                {row.size > 0 ? formatQuoteAmount(row.size) : "—"}
              </TableCell>
              <TableCell className={cn(numericCell, row.breakEvenPrice <= 0 && "text-muted-foreground")}>
                {row.breakEvenPrice > 0 ? formatSubscriptPrice(row.breakEvenPrice, 8) : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {row.liqPrice > 0 ? formatSubscriptPrice(row.liqPrice, 8) : "—"}
              </TableCell>
              <TableCell className={cn(numericCell, markLabel === "—" && "text-muted-foreground")}>
                {markLabel}
              </TableCell>
              <TableCell
                className={cn(
                  numericCell,
                  "font-medium",
                  row.pnl == null ? "text-muted-foreground" : signedAmountClass(row.pnl)
                )}
              >
                {row.pnl == null ? "—" : formatSignedQuote(row.pnl)}
              </TableCell>
              <TableCell
                className={cn(
                  numericCell,
                  "font-medium",
                  row.roiPct == null ? "text-muted-foreground" : signedAmountClass(row.roiPct)
                )}
              >
                {row.roiPct == null ? "—" : formatPercentChange(row.roiPct)}
              </TableCell>
              <TableCell className={timeCell}>{formatUtcDateTime(row.openedAt)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onAdjustMargin({
                        pairLabel: row.pairLabel,
                        pairId: row.pairId,
                        quoteSymbol: row.quoteSymbol,
                        balanceMargin: row.balanceMargin,
                      })
                    }
                    className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  >
                    {t("perps.adjustMargin")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onClose({
                        pairDisplay: `${row.pairLabel}${formatLeveragePairSuffix(row.leverage)}`,
                        pairId: row.pairId,
                        quoteSymbol: row.quoteSymbol,
                        baseSymbol: row.pairLabel.split("/")[0] ?? row.pairLabel,
                        side: row.side,
                        size: row.size,
                        breakEvenPrice: row.breakEvenPrice,
                        ...currentPriceFromClose(
                          pairQuotes.closeById.get(row.pairId),
                          pairQuotes.pairInfo.get(row.pairId)?.enginePriceDecimal
                        ),
                      })
                    }
                    className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  >
                    {t("perps.closePosition")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onDetails({
                        pairLabel: row.pairLabel,
                        pairId: row.pairId,
                        account: row.account,
                        positionId: Number(row.id),
                        openedAt: row.openedAt,
                      })
                    }
                    className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  >
                    {t("perps.details")}
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info(t("perps.positionActionComingSoon"))}
                    className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  >
                    {t("perps.flashClose")}
                  </button>
                </div>
              </TableCell>
            </TableRow>
            );
          })
        )}
      </TableBody>
    </OrdersTableFrame>
  );
}

function signedAmountClass(value: number) {
  if (value > 0) return "text-brand";
  if (value < 0) return "text-brand-alt";
  return "text-muted-foreground";
}

function formatSignedQuote(value: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = formatQuoteAmount(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return abs;
}

function PositionHistoryTable({
  onDetails,
}: {
  onDetails: (row: {
    id: string;
    account: string;
    pairLabel: string;
    pairId: number;
    openedAt: number;
    closedAt: number;
  }) => void;
}) {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: ORDERS_PAGE_SIZE }),
    []
  );

  const { data, isLoading, isFetching } = usePositionHistoryPagination(paginationReq, {
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(
    () => (data?.pageItems ?? []).map(positionHistoryRspToRow),
    [data?.pageItems]
  );

  const colSpan = 11;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyPositionHistory"),
  });

  return (
    <OrdersTableFrame>
      <OrdersTableHead>
        <TextHead>{t("perps.pair")}</TextHead>
        <NumericHead>{t("perps.tradeAmount")}</NumericHead>
        <NumericHead>{t("perps.fee")}</NumericHead>
        <NumericHead>{t("perps.addedMargin")}</NumericHead>
        <NumericHead>{t("perps.funding")}</NumericHead>
        <NumericHead>{t("perps.settledAmount")}</NumericHead>
        <NumericHead>{t("perps.pnl")}</NumericHead>
        <NumericHead>{t("perps.roi")}</NumericHead>
        <NumericHead>{t("perps.openedAt")}</NumericHead>
        <NumericHead>{t("perps.closedAt")}</NumericHead>
        <TextHead>{t("perps.action")}</TextHead>
      </OrdersTableHead>
      <TableBody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className={textCell}>{row.pairLabel}</TableCell>
              <TableCell className={numericCell}>{formatQuoteAmount(row.totalTradeMargin)}</TableCell>
              <TableCell className={numericCell}>{formatQuoteAmount(row.totalTradeFee)}</TableCell>
              <TableCell className={numericCell}>{formatQuoteAmount(row.totalMarginAdjust)}</TableCell>
              <TableCell className={numericCell}>{formatSignedQuote(row.totalFunding)}</TableCell>
              <TableCell className={numericCell}>{formatQuoteAmount(row.totalMarginSettled)}</TableCell>
              <TableCell className={cn(numericCell, "font-medium", signedAmountClass(row.realizedPnl))}>
                {formatSignedQuote(row.realizedPnl)}
              </TableCell>
              <TableCell className={cn(numericCell, "font-medium", signedAmountClass(row.roiPct))}>
                {formatPercentChange(row.roiPct)}
              </TableCell>
              <TableCell className={timeCell}>{formatUtcDateTime(row.openedAt)}</TableCell>
              <TableCell className={timeCell}>{formatUtcDateTime(row.closedAt)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onDetails(row)}
                  className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                >
                  {t("perps.details")}
                </button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </OrdersTableFrame>
  );
}

function OpenOrdersTable({
  onOrderDetails,
}: {
  onOrderDetails: (row: OpenOrderRow) => void;
}) {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();
  const { address, chainId, isConnected } = useWallet();
  const { signTypedDataAsync } = useSignTypedData();
  const { mutateAsync: submitCancel } = useCancelOrder();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useOrdersList({
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(
    () => (data ?? []).map(ordersRspToOpenOrderRow),
    [data]
  );

  async function handleCancel(row: OpenOrderRow) {
    if (!isAuthenticated || !isConnected || !address || chainId == null || row.side == null) {
      return;
    }
    if (!isPerpsExchangeConfigured()) {
      toast.error(t("perps.exchangeNotConfigured"));
      return;
    }
    if (row.status === "Cancelling" || cancellingOrderId != null) return;

    setCancellingOrderId(row.orderId);
    try {
      const balanceRsp = await getPerpsOrdersUserBalance();
      if (balanceRsp.userBalanceId == null) {
        toast.error(t("perps.cancelFailed"));
        return;
      }

      const { salt } = await getOrderSalt();
      const orderId = BigInt(row.orderId);
      const saltBi = BigInt(salt);

      const signature = await signTypedDataAsync(
        getCancelOrderSignTypedData({ orderId, salt: saltBi }, chainId)
      );

      await submitCancel({
        userBalanceId: balanceRsp.userBalanceId,
        orderId,
        salt: saltBi,
        signature,
      });

      toast.success(t("perps.orderCancelled"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("perps.cancelFailed")));
    } finally {
      setCancellingOrderId(null);
    }
  }

  const colSpan = 9;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyOpenOrders"),
  });

  return (
    <OrdersTableFrame>
      <OrdersTableHead>
        <TextHead>{t("perps.orderId")}</TextHead>
        <TextHead>{t("perps.pair")}</TextHead>
        <TextHead>{t("perps.side")}</TextHead>
        <NumericHead>{t("perps.orderPrice")}</NumericHead>
        <NumericHead>{t("perps.orderTotal")}</NumericHead>
        <NumericHead>{t("perps.marginRequired")}</NumericHead>
        <NumericHead>{t("perps.filledPct")}</NumericHead>
        <NumericHead>{t("perps.time")}</NumericHead>
        <TextHead>{t("perps.action")}</TextHead>
      </OrdersTableHead>
      <TableBody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => {
            const rowBusy = cancellingOrderId === row.orderId;
            const canCancel =
              isAuthenticated &&
              isConnected &&
              Boolean(address) &&
              chainId != null &&
              row.side != null &&
              row.status !== "Cancelling" &&
              cancellingOrderId == null;

            return (
              <TableRow key={row.orderId}>
                <TableCell className={idCell}>{row.orderId}</TableCell>
                <TableCell className={textCell}>
                  {row.pairLabel}
                  <span className="text-muted-foreground">{formatLeveragePairSuffix(row.leverage)}</span>
                </TableCell>
                <TableCell
                  className={cn(
                    textCell,
                    "font-medium",
                    row.side ? sideClass(row.side) : "text-muted-foreground"
                  )}
                >
                  {row.side === "buy"
                    ? t("perps.buy")
                    : row.side === "sell"
                      ? t("perps.sell")
                      : "—"}
                </TableCell>
                <TableCell className={numericCell}>
                  {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
                </TableCell>
                <TableCell className={numericCell}>{formatQuoteAmount(row.total)}</TableCell>
                <TableCell className={numericCell}>
                  {row.margin != null ? formatQuoteAmount(row.margin) : "—"}
                </TableCell>
                <TableCell className={numericCell}>
                  {row.fillPercent.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                  %
                </TableCell>
                <TableCell className={timeCell}>{formatUtcDateTime(row.placedAt)}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOrderDetails(row)}
                      className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                    >
                      {t("perps.details")}
                    </button>
                    {row.status === "Cancelling" ? (
                      <span className="text-muted-foreground text-xs">
                        {t("perps.cancelling")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canCancel || rowBusy}
                        onClick={() => void handleCancel(row)}
                        className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 disabled:text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium disabled:cursor-not-allowed"
                      >
                        {rowBusy ? t("perps.cancelling") : t("perps.cancel")}
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </OrdersTableFrame>
  );
}

function HistoryOrdersTable({
  onOrderDetails,
}: {
  onOrderDetails: (row: ReturnType<typeof ordersHistoryRspToRow>) => void;
}) {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: ORDERS_PAGE_SIZE }),
    []
  );

  const { data, isLoading, isFetching } = useOrdersHistoryPagination(paginationReq, {
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(
    () => (data?.pageItems ?? []).map(ordersHistoryRspToRow),
    [data?.pageItems]
  );

  const colSpan = 13;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyHistory"),
  });

  return (
    <OrdersTableFrame>
      <OrdersTableHead>
        <TextHead>{t("perps.orderId")}</TextHead>
        <TextHead>{t("perps.pair")}</TextHead>
        <TextHead>{t("perps.side")}</TextHead>
        <NumericHead>{t("perps.orderPrice")}</NumericHead>
        <NumericHead>{t("perps.average")}</NumericHead>
        <NumericHead>{t("perps.orderTotal")}</NumericHead>
        <NumericHead>{t("perps.lockedMargin")}</NumericHead>
        <NumericHead>{t("perps.filledValue")}</NumericHead>
        <NumericHead>{t("perps.fee")}</NumericHead>
        <NumericHead>{t("perps.placedAt")}</NumericHead>
        <NumericHead>{t("perps.completedAt")}</NumericHead>
        <TextHead>{t("perps.status")}</TextHead>
        <TextHead>{t("perps.action")}</TextHead>
      </OrdersTableHead>
      <TableBody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.orderId}>
              <TableCell className={idCell}>{row.orderId}</TableCell>
              <TableCell className={textCell}>
                {row.pairLabel}
                <span className="text-muted-foreground">{formatLeveragePairSuffix(row.leverage)}</span>
              </TableCell>
              <TableCell
                className={cn(
                  textCell,
                  "font-medium",
                  row.side ? sideClass(row.side) : "text-muted-foreground"
                )}
              >
                {row.side === "buy"
                  ? t("perps.buy")
                  : row.side === "sell"
                    ? t("perps.sell")
                    : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
              </TableCell>
              <TableCell className={numericCell}>
                {row.averagePrice != null
                  ? formatSubscriptPrice(row.averagePrice, row.enginePriceDecimal)
                  : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {row.total != null ? formatQuoteAmount(row.total) : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {row.lockedMargin != null ? formatQuoteAmount(row.lockedMargin) : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {row.filledValue != null ? formatQuoteAmount(row.filledValue) : "—"}
              </TableCell>
              <TableCell className={numericCell}>
                {row.fee > 0 ? formatQuoteAmount(row.fee) : "—"}
              </TableCell>
              <TableCell className={timeCell}>{formatUtcDateTime(row.placedAt)}</TableCell>
              <TableCell className={timeCell}>{formatUtcDateTime(row.completedAt)}</TableCell>
              <TableCell className="text-muted-foreground px-3 py-2.5 text-sm">
                {formatOrderHistoryStatus(row.status, t)}
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onOrderDetails(row)}
                  className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                >
                  {t("perps.details")}
                </button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </OrdersTableFrame>
  );
}

function sideClass(side: "buy" | "sell") {
  return side === "buy" ? "text-brand" : "text-brand-alt";
}

const EMPTY_CURRENT_PRICE = { currentPrice: "—", currentInput: "" };

/** Snapshot of the position-pair cache `close` for the close dialog. */
function currentPriceFromClose(
  close: ApiBigInt | undefined,
  enginePriceDecimal: number | undefined
): { currentPrice: string; currentInput: string } {
  if (close == null || enginePriceDecimal == null) return EMPTY_CURRENT_PRICE;
  const text = formatEnginePrice(
    enginePriceToNumber(close, enginePriceDecimal),
    enginePriceDecimal
  );
  return text ? { currentPrice: text.label, currentInput: text.input } : EMPTY_CURRENT_PRICE;
}
