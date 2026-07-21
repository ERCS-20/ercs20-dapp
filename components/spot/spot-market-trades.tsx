"use client";

import { useMemo } from "react";

import {
  MARKET_TRADES_MAX,
  marketTradesToSpotTrades,
} from "@/lib/spot/market-trades-parse";
import { formatQuantity, formatSubscriptPrice } from "@/lib/utils/price";
import type { SpotPair } from "@/lib/spot/types";
import { formatLocalTime } from "@/lib/utils/format/datetime";
import { cn } from "@/lib/utils";
import { useMarketTrades, useMarketTradesWs } from "@/services/spot/market/hooks";
import { useI18n } from "@/providers/i18n-provider";

export function SpotMarketTrades({
  pairId,
  enginePriceDecimal,
  pair,
  className,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  pair: SpotPair;
  className?: string;
}) {
  const { t } = useI18n();
  const { data, isLoading, isSuccess } = useMarketTrades(pairId);
  // REST first screen, then WS trade channel (model B).
  useMarketTradesWs(pairId, { enabled: isSuccess });

  const trades = useMemo(
    () =>
      enginePriceDecimal != null
        ? marketTradesToSpotTrades(data, enginePriceDecimal, MARKET_TRADES_MAX)
        : [],
    [data, enginePriceDecimal]
  );

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

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 sm:px-2">
        {isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("swap.loading")}</p>
        ) : (
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
                    {formatSubscriptPrice(trade.price, enginePriceDecimal ?? 8)}
                  </td>
                  <td className="text-foreground py-0.5 text-center tabular-nums">
                    {formatQuantity(trade.quantity)}
                  </td>
                  <td className="text-muted-foreground py-0.5 text-right tabular-nums">
                    {formatLocalTime(trade.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && trades.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("spot.emptyTrades")}</p>
        )}
      </div>
    </section>
  );
}
