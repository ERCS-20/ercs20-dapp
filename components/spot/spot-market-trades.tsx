"use client";

import { formatSpotPrice, formatSpotSize } from "@/lib/spot/format";
import type { SpotMarketTrade, SpotPair } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

export function SpotMarketTrades({
  trades,
  pair,
  className,
}: {
  trades: SpotMarketTrade[];
  pair: SpotPair;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border",
        className
      )}
      aria-label={t("spot.marketTrades")}
    >
      <div className="border-border/60 border-b px-3 py-2.5 sm:px-4">
        <h2 className="text-foreground text-sm font-medium">{t("spot.marketTrades")}</h2>
      </div>

      <div className="text-muted-foreground grid grid-cols-3 gap-2 px-3 py-2 text-[11px] font-medium sm:px-4 sm:text-xs">
        <span>{t("spot.price")}</span>
        <span className="text-center">{pair.baseSymbol}</span>
        <span className="text-right">{t("spot.time")}</span>
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-1 pb-2 sm:px-2">
        <table className="w-full text-[11px] sm:text-xs">
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-muted/40">
                <td
                  className={cn(
                    "py-0.5 tabular-nums",
                    trade.isBuy ? "text-brand" : "text-brand-alt"
                  )}
                >
                  {formatSpotPrice(trade.price)}
                </td>
                <td className="text-foreground py-0.5 text-center tabular-nums">
                  {formatSpotSize(trade.quantity)}
                </td>
                <td className="text-muted-foreground py-0.5 text-right tabular-nums">
                  {new Date(trade.time).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("spot.emptyTrades")}</p>
        )}
      </div>
    </section>
  );
}
