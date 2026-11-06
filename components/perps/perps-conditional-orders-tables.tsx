"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CandlestickChartIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  conditionalOrderToRow,
  formatConditionalStatus,
  type ConditionalOrderRow,
} from "@/lib/perps/conditional-orders-format";
import { cn } from "@/lib/utils";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  useCancelConditionalOrder,
  useConditionalOrders,
  useConditionalOrdersHistoryPagination,
} from "@/services/perps/orders/hooks";

const PAGE_SIZE = 50;
const textCell = "px-3 py-2.5 text-sm";
const numericCell = "px-3 py-2.5 text-sm tabular-nums";
const timeCell = "text-muted-foreground px-3 py-2.5 text-sm tabular-nums";

export function ConditionalOrdersTable() {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();
  const { mutateAsync: cancelOrder } = useCancelConditionalOrder();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useConditionalOrders({
    enabled: isAuthenticated,
    notifyError: false,
  });
  const rows = useMemo(
    () => (data ?? []).map((order) => conditionalOrderToRow(order, t)),
    [data, t]
  );
  const emptyMessage = tableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyConditionalOrders"),
  });

  async function handleCancel(row: ConditionalOrderRow) {
    if (!isAuthenticated || cancellingId != null) return;
    setCancellingId(row.idLabel);
    try {
      await cancelOrder({ id: row.id });
      toast.success(t("perps.orderCancelled"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("perps.cancelFailed")));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <OrdersTable>
      <OrdersHead>
        <TextHead>{t("perps.conditionalType")}</TextHead>
        <TextHead>{t("perps.pair")}</TextHead>
        <TextHead>{t("perps.side")}</TextHead>
        <TextHead>{t("perps.triggerCondition")}</TextHead>
        <NumericHead>{t("perps.limitPrice")}</NumericHead>
        <NumericHead>{t("perps.orderAmount")}</NumericHead>
        <NumericHead>{t("perps.marginRequired")}</NumericHead>
        <NumericHead>{t("perps.time")}</NumericHead>
        <TextHead>{t("perps.action")}</TextHead>
      </OrdersHead>
      <TableBody>
        {emptyMessage ? (
          <MessageRow
            colSpan={9}
            message={emptyMessage.message}
            showIcon={emptyMessage.showIcon}
          />
        ) : (
          rows.map((row) => (
            <TableRow key={row.idLabel}>
              <SharedCells row={row} t={t} />
              <TableCell className={timeCell}>{formatUtcDateTime(row.createdAt)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <button
                  type="button"
                  disabled={cancellingId != null}
                  onClick={() => void handleCancel(row)}
                  className="border-border text-brand hover:bg-muted/50 hover:text-brand/80 disabled:text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium disabled:cursor-not-allowed"
                >
                  {cancellingId === row.idLabel ? t("perps.cancelling") : t("perps.cancel")}
                </button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </OrdersTable>
  );
}

export function ConditionalOrdersHistoryTable() {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const req = useMemo(
    () => ({ currentPage, pageSize: PAGE_SIZE }),
    [currentPage]
  );
  const { data, isLoading, isFetching } = useConditionalOrdersHistoryPagination(req, {
    enabled: isAuthenticated,
    notifyError: false,
  });
  const rows = useMemo(
    () => (data?.pageItems ?? []).map((order) => conditionalOrderToRow(order, t)),
    [data?.pageItems, t]
  );
  const pageTotal = data?.totalPage ?? 0;
  const emptyMessage = tableMessage({
    authReady,
    isAuthenticated,
    isLoading,
    isFetching,
    hasRows: rows.length > 0,
    loadingMessage: t("swap.loading"),
    loginMessage: t("perps.loginToViewOrders"),
    emptyMessage: t("perps.emptyConditionalHistory"),
  });

  return (
    <div>
      <OrdersTable>
        <OrdersHead>
          <TextHead>{t("perps.conditionalType")}</TextHead>
          <TextHead>{t("perps.pair")}</TextHead>
          <TextHead>{t("perps.side")}</TextHead>
          <TextHead>{t("perps.triggerCondition")}</TextHead>
          <NumericHead>{t("perps.limitPrice")}</NumericHead>
          <NumericHead>{t("perps.orderAmount")}</NumericHead>
          <NumericHead>{t("perps.marginRequired")}</NumericHead>
          <NumericHead>{t("perps.placedAt")}</NumericHead>
          <NumericHead>{t("perps.completedAt")}</NumericHead>
          <TextHead>{t("perps.status")}</TextHead>
        </OrdersHead>
        <TableBody>
          {emptyMessage ? (
            <MessageRow
              colSpan={10}
              message={emptyMessage.message}
              showIcon={emptyMessage.showIcon}
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.idLabel}>
                <SharedCells row={row} t={t} />
                <TableCell className={timeCell}>{formatUtcDateTime(row.createdAt)}</TableCell>
                <TableCell className={timeCell}>
                  {row.completedAt == null ? "—" : formatUtcDateTime(row.completedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground px-3 py-2.5 text-sm">
                  {formatConditionalStatus(row.status, t)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </OrdersTable>
      {pageTotal > 1 ? (
        <div className="flex justify-end px-3 py-2">
          <div className="border-border/60 bg-background flex items-center rounded-lg border p-0.5">
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
            <span className="min-w-12 px-1 text-center text-xs font-medium tabular-nums">
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
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SharedCells({
  row,
  t,
}: {
  row: ConditionalOrderRow;
  t: (path: string) => string;
}) {
  return (
    <>
      <TableCell className={textCell}>{row.orderTypeLabel}</TableCell>
      <TableCell className={textCell}>{row.pairLabel}</TableCell>
      <TableCell
        className={cn(
          textCell,
          "font-medium",
          row.side === "buy" && "text-brand",
          row.side === "sell" && "text-brand-alt",
          row.side == null && "text-muted-foreground"
        )}
      >
        {row.side === "buy" ? t("perps.buy") : row.side === "sell" ? t("perps.sell") : "—"}
      </TableCell>
      <TableCell className={textCell}>{row.triggerText}</TableCell>
      <TableCell className={numericCell}>{row.limitPrice}</TableCell>
      <TableCell className={numericCell}>{row.quantity}</TableCell>
      <TableCell className={numericCell}>{row.margin}</TableCell>
    </>
  );
}

function OrdersTable({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-max text-sm">{children}</table>;
}

function OrdersHead({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="hover:bg-transparent">{children}</TableRow>
    </TableHeader>
  );
}

function TextHead({ children }: { children: ReactNode }) {
  return (
    <TableHead className="text-muted-foreground sticky top-0 z-10 h-9 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-3 text-left text-xs font-medium">
      {children}
    </TableHead>
  );
}

function NumericHead({ children }: { children: ReactNode }) {
  return (
    <TableHead className="text-muted-foreground sticky top-0 z-10 h-9 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-3 text-left text-xs font-medium">
      {children}
    </TableHead>
  );
}

function MessageRow({
  colSpan,
  message,
  showIcon = false,
}: {
  colSpan: number;
  message: string;
  showIcon?: boolean;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="px-3 py-10 text-center">
        {showIcon ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="bg-muted text-muted-foreground ring-border/60 flex size-10 items-center justify-center rounded-full ring-1">
              <CandlestickChartIcon aria-hidden className="size-5" />
            </div>
            <p className="text-muted-foreground text-center text-xs leading-relaxed sm:text-sm">
              {message}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
      </TableCell>
    </TableRow>
  );
}

function tableMessage({
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
}): { message: string; showIcon: boolean } | null {
  if (!authReady || (isAuthenticated && (isLoading || (isFetching && !hasRows)))) {
    return { message: loadingMessage, showIcon: false };
  }
  if (!isAuthenticated) return { message: loginMessage, showIcon: false };
  if (!hasRows) return { message: emptyMessage, showIcon: true };
  return null;
}
