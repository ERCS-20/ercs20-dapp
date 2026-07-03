"use client";

import { cn } from "@/lib/utils";
import { getMockChartBars } from "@/lib/spot/mock-market";
import type { ChartTimeframe, SpotPair } from "@/lib/spot/types";
import { useI18n } from "@/providers/i18n-provider";

const TIMEFRAMES: ChartTimeframe[] = ["1m", "5m", "1h", "1D"];

export function SpotChartPanel({
  pair,
  timeframe,
  onTimeframeChange,
  className,
}: {
  pair: SpotPair;
  timeframe: ChartTimeframe;
  onTimeframeChange: (tf: ChartTimeframe) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const bars = getMockChartBars(pair, timeframe);

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-[280px] flex-col overflow-hidden rounded-xl border lg:min-h-[420px]",
        className
      )}
      aria-label={t("spot.chart")}
    >
      <div className="border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
        <span className="text-foreground text-sm font-medium">{t("spot.chart")}</span>
        <div className="flex gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                timeframe === tf
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex flex-1 items-end gap-px pb-6">
          {bars.map((h, i) => (
            <div
              key={i}
              className="bg-primary/70 dark:bg-primary/50 min-w-0 flex-1 rounded-sm"
              style={{ height: `${h}%` }}
              aria-hidden
            />
          ))}
        </div>
        <p className="text-muted-foreground absolute bottom-3 left-3 right-3 text-center text-xs">
          {t("spot.chartFeedHint")}
        </p>
      </div>
    </section>
  );
}
