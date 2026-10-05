"use client";

import { ScrollTextIcon } from "lucide-react";
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
  cancelReasonLabel,
  cancelStatusLabel,
  ordersCancelHistoryRspToRow,
} from "@/lib/perps/order-detail-format";
import {
  formatLeveragePairSuffix,
  ordersTradeHistoryRspToRow,
} from "@/lib/perps/open-orders-format";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import {
  useOrdersCancelHistoryList,
  useOrdersTradeHistoryList,
} from "@/services/perps/orders/hooks";
import type { PerpsPositionEventsListReq } from "@/services/perps/orders/types";

export type OrderDetailTarget = {
  orderId: string;
  pairLabel: string;
  pairId?: number;
  account?: string;
  placedAt: number;
  completedAt?: number;
};

type DetailTab = "fills" | "cancels";

export function PerpsOrderDetailDialog({
  target,
  onOpenChange,
}: {
  target: OrderDetailTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<DetailTab>("fills");
  const open = target != null;

  const tradeReq = useMemo(
    (): PerpsPositionEventsListReq => ({
      pairId: target?.pairId ?? Number.NaN,
      account: (target?.account ?? "").toLowerCase(),
      fromBlockTimestamp: target?.placedAt ?? 0,
      toBlockTimestamp: target?.completedAt ?? Date.now(),
    }),
    [target?.pairId, target?.account, target?.placedAt, target?.completedAt]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTab("fills");
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
              <ScrollTextIcon aria-hidden className="size-5" />
            </div>
            <DialogHeader className="min-w-0 flex-1 gap-1.5 text-left sm:place-items-start">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t("perps.orderDetails")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {target
                  ? `${target.pairLabel} · ${t("perps.orderId")} ${target.orderId}`
                  : "—"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as DetailTab)}
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            <TabsList className="h-9 w-full">
              <TabsTrigger
                value="fills"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("fills")}
              >
                {t("perps.tabFills")}
              </TabsTrigger>
              <TabsTrigger
                value="cancels"
                className="px-2 text-xs sm:text-sm"
                onClick={() => setTab("cancels")}
              >
                {t("perps.tabCancelHistory")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fills" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "fills" && target ? (
                <FillsPane req={tradeReq} orderId={target.orderId} />
              ) : null}
            </TabsContent>
            <TabsContent value="cancels" className="mt-0 min-h-0 flex-1 overflow-hidden">
              {tab === "cancels" && target ? (
                <CancelsPane orderId={target.orderId} />
              ) : null}
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

function FillsPane({ req, orderId }: { req: PerpsPositionEventsListReq; orderId: string }) {
  const { t } = useI18n();
  const query = useOrdersTradeHistoryList(req);
  const rows = useMemo(
    () =>
      (query.data ?? [])
        .map(ordersTradeHistoryRspToRow)
        .filter((row) => row.orderId === orderId),
    [query.data, orderId]
  );

  return (
    <PanelShell>
      {query.isLoading ? (
        <PanelSkeleton label={t("swap.loading")} />
      ) : rows.length === 0 ? (
        <PanelStatus message={t("perps.emptyPositionFills")} />
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

function CancelsPane({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const query = useOrdersCancelHistoryList({ orderId });
  const rows = useMemo(
    () => (query.data ?? []).map(ordersCancelHistoryRspToRow),
    [query.data]
  );

  return (
    <PanelShell>
      {query.isLoading ? (
        <PanelSkeleton label={t("swap.loading")} />
      ) : rows.length === 0 ? (
        <PanelStatus message={t("perps.emptyCancelHistory")} />
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TextHead>{t("perps.time")}</TextHead>
              <NumericHead>{t("perps.amount")}</NumericHead>
              <NumericHead>{t("perps.lockedMargin")}</NumericHead>
              <TextHead>{t("perps.ledgerType")}</TextHead>
              <TextHead className="text-right">{t("perps.status")}</TextHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                  {formatUtcDateTime(row.createdAt)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {formatQuoteAmount(row.amount)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right tabular-nums">
                  {formatQuoteAmount(row.margin)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-sm">
                  {cancelReasonLabel(row.reasonCode, t)}
                </TableCell>
                <TableCell className="text-muted-foreground px-3 py-2.5 text-right text-xs">
                  {cancelStatusLabel(row.status, t)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/60 min-h-0 max-h-[min(52vh,360px)] overflow-auto rounded-xl border">
      {children}
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <p className="text-muted-foreground px-4 py-8 text-center text-sm" role="status">
      {label}
    </p>
  );
}

function PanelStatus({ message }: { message: string }) {
  return <p className="text-muted-foreground px-4 py-8 text-center text-sm">{message}</p>;
}

function TextHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "bg-muted/80 text-muted-foreground sticky top-0 px-3 py-2 text-xs font-medium",
        className
      )}
    >
      {children}
    </TableHead>
  );
}

function NumericHead({ children }: { children: ReactNode }) {
  return <TextHead className="text-right">{children}</TextHead>;
}
