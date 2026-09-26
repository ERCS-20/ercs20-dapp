"use client";

import { useMemo } from "react";

import {
  MARKET_TRADES_MAX,
  marketTradesToPerpsTrades,
} from "@/lib/market/market-trades-parse";
import { formatQuantity, formatSubscriptPrice } from "@/lib/utils/price";
import type { PerpsPair } from "@/lib/perps/types";
import { formatLocalTime } from "@/lib/utils/format/datetime";
import { cn } from "@/lib/utils";
import { useMarketTrades, useMarketTradesWs } from "@/services/perps/market/hooks";
import { useI18n } from "@/providers/i18n-provider";

export function PerpsMarketTrades({
  pairId,
  enginePriceDecimal,
  pair,
  className,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  pair: PerpsPair;
  className?: string;
}) {
  const { t } = useI18n();
  const { data, isLoading, isSuccess } = useMarketTrades(pairId);
  // REST first screen, then WS trade channel (model B).
  useMarketTradesWs(pairId, { enabled: isSuccess });

  const trades = useMemo(
    () =>
      enginePriceDecimal != null
        ? marketTradesToPerpsTrades(data, enginePriceDecimal, MARKET_TRADES_MAX)
        : [],
    [data, enginePriceDecimal]
  );

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border",
        className
      )}
      aria-label={t("perps.marketTrades")}
    >
      <div className="border-border/60 border-b px-3 py-2.5 sm:px-4">
        <h2 className="text-foreground text-sm font-medium">{t("perps.marketTrades")}</h2>
      </div>

      <div className="text-muted-foreground grid grid-cols-3 gap-2 px-3 py-2 text-[11px] font-medium sm:px-4 sm:text-xs">
        <span>{t("perps.price")}</span>
        <span className="text-center">{pair.quoteSymbol}</span>
        <span className="text-right">{t("perps.time")}</span>
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 sm:px-4">
        {isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("swap.loading")}</p>
        ) : (
          <div className="w-full text-[11px] sm:text-xs">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="hover:bg-muted/40 grid grid-cols-3 gap-2 py-0.5"
              >
                <span
                  className={cn(
                    "tabular-nums",
                    trade.isBuy ? "text-brand" : "text-brand-alt"
                  )}
                >
                  {formatSubscriptPrice(trade.price, enginePriceDecimal ?? 8)}
                </span>
                <span className="text-foreground text-center tabular-nums">
                  {formatQuantity(trade.price * trade.quantity)}
                </span>
                <span className="text-muted-foreground text-right tabular-nums">
                  {formatLocalTime(trade.time)}
                </span>
              </div>
            ))}
          </div>
        )}
        {!isLoading && trades.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("perps.emptyTrades")}</p>
        )}
      </div>
    </section>
  );
}
