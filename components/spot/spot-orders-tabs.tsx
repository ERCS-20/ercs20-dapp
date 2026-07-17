"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import {
  formatOpenOrderStatus,
  formatOrderHistoryStatus,
  formatTradeStatus,
  ordersHistoryRspToRow,
  ordersRspToOpenOrderRow,
  ordersTradeHistoryRspToRow,
  type OpenOrderRow,
} from "@/lib/spot/open-orders-format";
import { parsePairCode } from "@/lib/spot/pair-api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getCancelOrderSignTypedData } from "@/lib/orders/cancel-order-eip712";
import { isSpotExchangeConfigured } from "@/lib/config/spot-exchange";
import {
  formatQuantity,
  formatQuoteAmount,
  formatSubscriptPrice,
} from "@/lib/utils/price";
import { shortTxHash } from "@/lib/utils/format/address";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { getOrderSalt, getOrdersUserBalance, getPairByCode } from "@/services/spot/orders/api";
import {
  useCancelOrder,
  useOrdersHistoryPagination,
  useOrdersPagination,
  useOrdersTradeHistoryPagination,
} from "@/services/spot/orders/hooks";

export type SpotOrdersTab = "open" | "history" | "trades";

const ORDERS_PAGE_SIZE = 50;

export function SpotOrdersTabs({
  tab,
  onTabChange,
  className,
}: {
  tab: SpotOrdersTab;
  onTabChange: (t: SpotOrdersTab) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const tabs: { id: SpotOrdersTab; label: string }[] = [
    { id: "open", label: t("spot.openOrders") },
    { id: "history", label: t("spot.orderHistory") },
    { id: "trades", label: t("spot.tradeHistory") },
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

function OpenOrdersTable() {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();
  const { address, chainId, isConnected } = useWallet();
  const { signTypedDataAsync } = useSignTypedData();
  const { mutateAsync: submitCancel } = useCancelOrder();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: ORDERS_PAGE_SIZE }),
    []
  );

  const { data, isLoading, isFetching } = useOrdersPagination(paginationReq, {
    enabled: isAuthenticated,
    notifyError: false,
  });

  const rows = useMemo(
    () => (data?.pageItems ?? []).map(ordersRspToOpenOrderRow),
    [data?.pageItems]
  );

  async function handleCancel(row: OpenOrderRow) {
    if (!isAuthenticated || !isConnected || !address || chainId == null || row.side == null) {
      return;
    }
    if (!isSpotExchangeConfigured()) {
      toast.error(t("spot.exchangeNotConfigured"));
      return;
    }
    if (row.status === "Cancelling" || cancellingOrderId != null) return;

    const parsed = parsePairCode(row.pairCode);
    if (!parsed) {
      toast.error(t("spot.cancelFailed"));
      return;
    }

    setCancellingOrderId(row.orderId);
    try {
      const pair = await getPairByCode({
        baseToken: parsed.base,
        quoteToken: parsed.quote,
      });
      // Cancel must use makerToken: buy pays quote, sell pays base.
      const tokenAddress =
        row.side === "buy" ? pair.quoteTokenAddress : pair.baseTokenAddress;

      const balanceRsp = await getOrdersUserBalance({ tokenAddress });
      if (balanceRsp.userBalanceId == null) {
        toast.error(t("spot.cancelFailed"));
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
        tokenAddress,
        salt: saltBi,
        signature,
      });

      toast.success(t("spot.orderCancelled"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("spot.cancelFailed")));
    } finally {
      setCancellingOrderId(null);
    }
  }

  const colSpan = 10;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("spot.loginToViewOrders"),
    emptyMessage: t("spot.emptyOpenOrders"),
  });

  return (
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.time")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderPrice")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderAmount")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderTotal")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.filledPct")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.status")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("spot.action")}</th>
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
                <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {new Date(row.placedAt).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{row.pairLabel}</td>
                <td
                  className={cn(
                    "py-2.5 pr-4 font-medium whitespace-nowrap",
                    row.side ? sideClass(row.side) : "text-muted-foreground"
                  )}
                >
                  {row.side === "buy"
                    ? t("spot.buy")
                    : row.side === "sell"
                      ? t("spot.sell")
                      : "—"}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatQuantity(row.quantity)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {formatQuoteAmount(row.total)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                  {row.fillPercent.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                  %
                </td>
                <td className="text-muted-foreground py-2.5 pr-4 whitespace-nowrap">
                  {formatOpenOrderStatus(row.status, t)}
                </td>
                <td className="py-2.5 whitespace-nowrap">
                  {row.status === "Cancelling" ? (
                    <span className="text-muted-foreground text-xs">
                      {t("spot.cancelling")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canCancel || rowBusy}
                      onClick={() => void handleCancel(row)}
                      className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 disabled:text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium disabled:cursor-not-allowed"
                    >
                      {rowBusy ? t("spot.cancelling") : t("spot.cancel")}
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
    loginMessage: t("spot.loginToViewOrders"),
    emptyMessage: t("spot.emptyHistory"),
  });

  return (
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderPrice")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.average")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderAmount")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.filledAmount")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderTotal")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.fee")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.placedAt")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.completedAt")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("spot.status")}</th>
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
              <td className="py-2.5 pr-4 whitespace-nowrap">{row.pairLabel}</td>
              <td
                className={cn(
                  "py-2.5 pr-4 font-medium whitespace-nowrap",
                  row.side ? sideClass(row.side) : "text-muted-foreground"
                )}
              >
                {row.side === "buy"
                  ? t("spot.buy")
                  : row.side === "sell"
                    ? t("spot.sell")
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
                {formatQuantity(row.quantity)}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {formatQuantity(row.filledQuantity)}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.total != null ? formatQuoteAmount(row.total) : "—"}
              </td>
              <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {row.fee > 0 ? formatQuoteAmount(row.fee) : "—"}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {new Date(row.placedAt).toLocaleString()}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {new Date(row.completedAt).toLocaleString()}
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

  const colSpan = 8;
  const emptyMessage = resolveOrdersTableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("spot.loginToViewOrders"),
    emptyMessage: t("spot.emptyTrades"),
  });

  return (
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.orderId")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.pair")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.side")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.price")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.amount")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.time")}</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap">{t("spot.status")}</th>
          <th className="pb-2 font-medium whitespace-nowrap">{t("spot.txHash")}</th>
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
              <td className="py-2.5 pr-4 whitespace-nowrap">{row.pairLabel}</td>
              <td
                className={cn(
                  "py-2.5 pr-4 font-medium whitespace-nowrap",
                  row.placeSide ? sideClass(row.placeSide) : "text-muted-foreground"
                )}
              >
                {row.placeSide === "buy"
                  ? t("spot.buy")
                  : row.placeSide === "sell"
                    ? t("spot.sell")
                    : "—"}
              </td>
              <td className="py-2.5 pr-4  tabular-nums whitespace-nowrap">
                {formatSubscriptPrice(row.price, row.enginePriceDecimal)}
              </td>
              <td className="py-2.5 pr-4  tabular-nums whitespace-nowrap">
                {formatQuantity(row.quantity)}
              </td>
              <td className="text-muted-foreground py-2.5 pr-4 tabular-nums whitespace-nowrap">
                {new Date(row.tradeTime).toLocaleString()}
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
