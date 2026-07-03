"use client";

import { formatUnits } from "viem";

import { Button } from "@/components/ui/button";
import {
  formatSpotPrice,
  formatSpotSize,
  formatSpotTotal,
  shortTxHash,
} from "@/lib/spot/format";
import type {
  SpotCancelStatus,
  SpotOrder,
  SpotOrderStatus,
  SpotUserTrade,
} from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

export type BottomTab = "open" | "history" | "trades";

export function SpotBottomPanel({
  tab,
  onTabChange,
  openOrders,
  historyOrders,
  tradeHistory,
  onCancelOrder,
  onClaimCancel,
  className,
}: {
  tab: BottomTab;
  onTabChange: (t: BottomTab) => void;
  openOrders: SpotOrder[];
  historyOrders: SpotOrder[];
  tradeHistory: SpotUserTrade[];
  onCancelOrder: (id: string) => void;
  onClaimCancel: (id: string) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const tabs: { id: BottomTab; label: string }[] = [
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
        {tab === "open" && (
          <OpenOrdersTable
            orders={openOrders}
            empty={t("spot.emptyOpenOrders")}
            onCancel={onCancelOrder}
            onClaim={onClaimCancel}
          />
        )}
        {tab === "history" && (
          <HistoryOrdersTable orders={historyOrders} empty={t("spot.emptyHistory")} />
        )}
        {tab === "trades" && (
          <TradeHistoryTable trades={tradeHistory} empty={t("spot.emptyTrades")} />
        )}
      </div>
    </section>
  );
}

function OpenOrdersTable({
  orders,
  empty,
  onCancel,
  onClaim,
}: {
  orders: SpotOrder[];
  empty: string;
  onCancel: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const { t } = useI18n();

  if (orders.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{empty}</p>;
  }

  return (
    <table className="w-full min-w-[880px] text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 font-medium">{t("spot.time")}</th>
          <th className="pb-2 font-medium">{t("spot.pair")}</th>
          <th className="pb-2 font-medium">{t("spot.side")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.price")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.amount")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.executed")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.totalLabel")}</th>
          <th className="pb-2 font-medium">{t("spot.txHash")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-border/40 border-b last:border-0">
            <td className="text-muted-foreground py-2.5 tabular-nums">
              {new Date(o.createdAt).toLocaleString()}
            </td>
            <td className="py-2.5">{o.pairLabel}</td>
            <td className={cn("py-2.5 font-medium", sideClass(o.side))}>
              {o.side === "buy" ? t("spot.buy") : t("spot.sell")}
            </td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotPrice(o.price)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotSize(o.amount)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotSize(o.filled)}</td>
            <td className="py-2.5 text-right tabular-nums">
              {formatSpotTotal(o.price * o.amount)} {o.pairLabel.split("/")[1]}
            </td>
            <td className="text-muted-foreground py-2.5 font-mono text-xs">
              {shortTxHash(o.txHash)}
            </td>
            <td className="py-2.5 text-right">
              <CancelAction
                cancelStatus={o.cancelStatus}
                onCancel={() => onCancel(o.id)}
                onClaim={() => onClaim(o.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HistoryOrdersTable({
  orders,
  empty,
}: {
  orders: SpotOrder[];
  empty: string;
}) {
  const { t } = useI18n();

  if (orders.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{empty}</p>;
  }

  return (
    <table className="w-full min-w-[880px] text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 font-medium">{t("spot.time")}</th>
          <th className="pb-2 font-medium">{t("spot.pair")}</th>
          <th className="pb-2 font-medium">{t("spot.side")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.price")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.amount")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.average")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.fee")}</th>
          <th className="pb-2 font-medium">{t("spot.status")}</th>
          <th className="pb-2 font-medium">{t("spot.txHash")}</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-border/40 border-b last:border-0">
            <td className="text-muted-foreground py-2.5 tabular-nums">
              {new Date(o.createdAt).toLocaleString()}
            </td>
            <td className="py-2.5">{o.pairLabel}</td>
            <td className={cn("py-2.5 font-medium", sideClass(o.side))}>
              {o.side === "buy" ? t("spot.buy") : t("spot.sell")}
            </td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotPrice(o.price)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotSize(o.amount)}</td>
            <td className="py-2.5 text-right tabular-nums">
              {o.average > 0 ? formatSpotPrice(o.average) : "—"}
            </td>
            <td className="py-2.5 text-right tabular-nums">
              {o.fee > 0 ? formatSpotTotal(o.fee) : "—"}
            </td>
            <td className="text-muted-foreground py-2.5">{statusLabel(o.status, t)}</td>
            <td className="text-muted-foreground py-2.5 font-mono text-xs">
              {shortTxHash(o.txHash)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TradeHistoryTable({
  trades,
  empty,
}: {
  trades: SpotUserTrade[];
  empty: string;
}) {
  const { t } = useI18n();

  if (trades.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{empty}</p>;
  }

  return (
    <table className="w-full min-w-[720px] text-sm">
      <thead>
        <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
          <th className="pb-2 font-medium">{t("spot.time")}</th>
          <th className="pb-2 font-medium">{t("spot.pair")}</th>
          <th className="pb-2 font-medium">{t("spot.side")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.price")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.amount")}</th>
          <th className="pb-2 text-right font-medium">{t("spot.fee")}</th>
          <th className="pb-2 font-medium">{t("spot.txHash")}</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((tr) => (
          <tr key={tr.id} className="border-border/40 border-b last:border-0">
            <td className="text-muted-foreground py-2.5 tabular-nums">
              {new Date(tr.time).toLocaleString()}
            </td>
            <td className="py-2.5">{tr.pairLabel}</td>
            <td className={cn("py-2.5 font-medium", sideClass(tr.side))}>
              {tr.side === "buy" ? t("spot.buy") : t("spot.sell")}
            </td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotPrice(tr.price)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotSize(tr.quantity)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatSpotTotal(tr.fee)}</td>
            <td className="text-muted-foreground py-2.5 font-mono text-xs">
              {shortTxHash(tr.txHash)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CancelAction({
  cancelStatus,
  onCancel,
  onClaim,
}: {
  cancelStatus: SpotCancelStatus;
  onCancel: () => void;
  onClaim: () => void;
}) {
  const { t } = useI18n();

  if (cancelStatus === "cancelling") {
    return (
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onClaim}>
        {t("spot.claim")}
      </Button>
    );
  }
  if (cancelStatus === "cancelClaim") {
    return (
      <span className="text-muted-foreground text-xs">{t("spot.cancelling")}</span>
    );
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>
      {t("spot.cancel")}
    </Button>
  );
}

function sideClass(side: "buy" | "sell") {
  return side === "buy" ? "text-brand" : "text-brand-alt";
}

function statusLabel(status: SpotOrderStatus, t: (k: string) => string): string {
  if (status === "open") return t("spot.statusOpen");
  if (status === "filled") return t("spot.statusFilled");
  if (status === "partial") return t("spot.statusPartial");
  return t("spot.statusCancelled");
}

/** Format bigint balance for display — exported for spot-view */
export function formatBalanceDisplay(
  value: bigint | undefined,
  decimals: number,
  fallback = "0"
): string {
  if (value == null) return fallback;
  try {
    const s = formatUnits(value, decimals);
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return fallback;
  }
}
