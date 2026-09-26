"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import {
  formatLeveragePairSuffix,
  formatOrderHistoryStatus,
  formatTradeStatus,
  ordersHistoryRspToRow,
  ordersRspToOpenOrderRow,
  ordersTradeHistoryRspToRow,
  type OpenOrderRow,
} from "@/lib/perps/open-orders-format";
import { positionsRspToRow } from "@/lib/perps/positions-format";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getCancelOrderSignTypedData } from "@/lib/perps/cancel-order-eip712";
import { isPerpsExchangeConfigured } from "@/lib/config/perps-exchange";
import {
  formatQuoteAmount,
  formatSubscriptPrice,
} from "@/lib/utils/price";
import { shortTxHash } from "@/lib/utils/format/address";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { getOrderSalt, getPerpsOrdersUserBalance } from "@/services/perps/orders/api";
import {
  useCancelOrder,
  useOrdersHistoryPagination,
  useOrdersList,
  useOrdersTradeHistoryPagination,
  usePositionsList,
} from "@/services/perps/orders/hooks";

export type PerpsOrdersTab = "positions" | "open" | "history" | "trades";

const ORDERS_PAGE_SIZE = 50;

export function PerpsOrdersTabs({
  tab,
  onTabChange,
  className,
}: {
  tab: PerpsOrdersTab;
  onTabChange: (t: PerpsOrdersTab) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const tabs: { id: PerpsOrdersTab; label: string }[] = [
    { id: "positions", label: t("perps.positions") },
    { id: "open", label: t("perps.openOrders") },
    { id: "history", label: t("perps.orderHistory") },
    { id: "trades", label: t("perps.tradeHistory") },
  ];

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-0 flex-col overflow-hidden rounded-xl border",
        className
      )}
    >
      <div className="border-border/60 flex gap-1 overflow-x-auto border-b px-2 pt-2 sm:px-3">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm font-medium transition-colors",
              tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {tab === id && (
              <span className="bg-primary absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4">
        {tab === "positions" && <PositionsTable />}
        {tab === "open" && <OpenOrdersTable />}
        {tab === "history" && <HistoryOrdersTable />}
        {tab === "trades" && <TradeHistoryTable />}
      </div>
    </section>
  );
}

function OrdersTableMessageRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-muted-foreground py-8 text-center text-sm">
        {message}
      </td>
    </tr>
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

function PositionsTable() {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  const { data, isLoading, isFetching } = usePositionsList({
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(() => (data ?? []).map(positionsRspToRow), [data]);

  const colSpan = 7;
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
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.average")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.liqPrice")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderTotal")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.marginRequired")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("perps.updatedAt")}</th>
        </tr>
      </thead>
      <tbody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => (
            <tr key={row.id} className="border-border/40 border-b last:border-0">
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {row.pairLabel}
                {formatLeveragePairSuffix(row.leverage)}
              </td>
              <td
                className={cn(
                  "py-2.5 pr-4 font-medium whitespace-nowrap",
                  row.side ? sideClass(row.side) : "text-muted-foreground"
                )}
              >
                {row.side === "buy"
                  ? t("perps.long")
                  : row.side === "sell"
                    ? t("perps.short")
                    : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.avgEntry > 0 ? formatSubscriptPrice(row.avgEntry, 8) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.liqPrice > 0 ? formatSubscriptPrice(row.liqPrice, 8) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.total > 0 ? formatQuoteAmount(row.total) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatQuoteAmount(row.margin)}
              </td>
              <td className="text-muted-foreground py-2.5 tabular-nums whitespace-nowrap">
                {formatUtcDateTime(row.updatedAt)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function OpenOrdersTable() {
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
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderPrice")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderTotal")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.marginRequired")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.filledPct")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.time")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("perps.action")}</th>
        </tr>
      </thead>
      <tbody>
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
              <tr key={row.orderId} className="border-border/40 border-b last:border-0">
                <td className="text-muted-foreground py-2.5 pr-4 text-sm tabular-nums whitespace-nowrap">
                  {row.orderId}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  {row.pairLabel}
                  {formatLeveragePairSuffix(row.leverage)}
                </td>
                <td
                  className={cn(
                    "py-2.5 pr-4 font-medium whitespace-nowrap",
                    row.side ? sideClass(row.side) : "text-muted-foreground"
                  )}
                >
                  {row.side === "buy"
                    ? t("perps.buy")
                    : row.side === "sell"
                      ? t("perps.sell")
                      : "—"}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatQuoteAmount(row.total)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {row.margin != null ? formatQuoteAmount(row.margin) : "—"}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {row.fillPercent.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                  %
                </td>
                <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatUtcDateTime(row.placedAt)}
                </td>
                <td className="py-2.5 whitespace-nowrap">
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
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function HistoryOrdersTable() {
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

  const colSpan = 12;
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
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderPrice")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.average")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderTotal")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.lockedMargin")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.filledValue")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.fee")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.placedAt")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.completedAt")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("perps.status")}</th>
        </tr>
      </thead>
      <tbody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row) => (
            <tr key={row.orderId} className="border-border/40 border-b last:border-0">
              <td className="text-muted-foreground py-2.5 pr-4 text-sm tabular-nums whitespace-nowrap">
                {row.orderId}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {row.pairLabel}
                {formatLeveragePairSuffix(row.leverage)}
              </td>
              <td
                className={cn(
                  "py-2.5 pr-4 font-medium whitespace-nowrap",
                  row.side ? sideClass(row.side) : "text-muted-foreground"
                )}
              >
                {row.side === "buy"
                  ? t("perps.buy")
                  : row.side === "sell"
                    ? t("perps.sell")
                    : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.averagePrice != null
                  ? formatSubscriptPrice(row.averagePrice, row.enginePriceDecimal)
                  : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.total != null ? formatQuoteAmount(row.total) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.lockedMargin != null ? formatQuoteAmount(row.lockedMargin) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.filledValue != null ? formatQuoteAmount(row.filledValue) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.fee > 0 ? formatQuoteAmount(row.fee) : "—"}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatUtcDateTime(row.placedAt)}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatUtcDateTime(row.completedAt)}
              </td>
              <td className="text-muted-foreground py-2.5 whitespace-nowrap">
                {formatOrderHistoryStatus(row.status, t)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function TradeHistoryTable() {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: ORDERS_PAGE_SIZE }),
    []
  );

  const { data, isLoading, isFetching } = useOrdersTradeHistoryPagination(paginationReq, {
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(
    () => (data?.pageItems ?? []).map(ordersTradeHistoryRspToRow),
    [data?.pageItems]
  );

  const colSpan = 10;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyTrades"),
  });

  return (
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.price")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.filled")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.fee")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.role")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.time")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("perps.status")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("perps.txHash")}</th>
        </tr>
      </thead>
      <tbody>
        {emptyMessage ? (
          <OrdersTableMessageRow colSpan={colSpan} message={emptyMessage} />
        ) : (
          rows.map((row, i) => (
            <tr
              key={`${row.orderId}-${row.tradeTime}-${row.txHash}-${i}`}
              className="border-border/40 border-b last:border-0"
            >
              <td className="text-muted-foreground py-2.5 pr-4 text-sm tabular-nums whitespace-nowrap">
                {row.orderId}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {row.pairLabel}
                {formatLeveragePairSuffix(row.leverage)}
              </td>
              <td
                className={cn(
                  "py-2.5 pr-4 font-medium whitespace-nowrap",
                  row.placeSide ? sideClass(row.placeSide) : "text-muted-foreground"
                )}
              >
                {row.placeSide === "buy"
                  ? t("perps.buy")
                  : row.placeSide === "sell"
                    ? t("perps.sell")
                    : "—"}
              </td>
              <td className="py-2.5 pr-4  tabular-nums whitespace-nowrap">
                {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
              </td>
              <td className="py-2.5 pr-4  tabular-nums whitespace-nowrap">
                {formatQuoteAmount(row.filledValue)}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.fee > 0 ? formatQuoteAmount(row.fee) : "—"}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 whitespace-nowrap">
                {row.matchedSide === "maker"
                  ? t("perps.roleMaker")
                  : row.matchedSide === "taker"
                    ? t("perps.roleTaker")
                    : "—"}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatUtcDateTime(row.tradeTime)}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 whitespace-nowrap">
                {formatTradeStatus(row.tradeStatus, t)}
              </td>
              <td className="text-muted-foreground py-2.5 font-mono text-xs whitespace-nowrap">
                {row.txHash ? shortTxHash(row.txHash) : "—"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function sideClass(side: "buy" | "sell") {
  return side === "buy" ? "text-brand" : "text-brand-alt";
}
