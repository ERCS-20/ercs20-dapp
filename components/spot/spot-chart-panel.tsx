"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import {
  CHART_INTERVAL_OPTIONS,
  KLINE_FIRST_SCREEN_LIMIT,
  resolveChartRequest,
  type ChartView,
} from "@/lib/spot/chart-interval";
import { useI18n } from "@/providers/i18n-provider";
import { useKlineList } from "@/services/spot/market/hooks";

const LightweightKlineChart = dynamic(
  () =>
    import("@/components/spot/lightweight-kline-chart").then(
      (m) => m.LightweightKlineChart
    ),
  {
    ssr: false,
    loading: () => <div className="bg-muted/40 h-full min-h-[220px] w-full animate-pulse" />,
  }
);

export function SpotChartPanel({
  pairId,
  enginePriceDecimal,
  view,
  onViewChange,
  className,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  view: ChartView;
  onViewChange: (view: ChartView) => void;
  className?: string;
}) {
  const { t } = useI18n();

  const { apiInterval, chartType } = useMemo(
    () => resolveChartRequest(view),
    [view]
  );

  const chartReady =
    pairId != null && enginePriceDecimal != null && enginePriceDecimal >= 0;

  const { data, isLoading, isError } = useKlineList(
    chartReady
      ? {
          pairId,
          interval: apiInterval,
          limit: KLINE_FIRST_SCREEN_LIMIT,
        }
      : undefined,
    { enabled: chartReady }
  );

  const bars = data?.bars ?? [];
  const showChart = chartReady && !isLoading && !isError && bars.length > 0;

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
        <div className="scrollbar-none flex max-w-[min(100%,560px)] gap-0.5 overflow-x-auto">
          {CHART_INTERVAL_OPTIONS.map((option) => (
            <button
              key={option.view}
              type="button"
              onClick={() => onViewChange(option.view)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === option.view
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 p-2 sm:p-3">
        {!chartReady && (
          <div className="bg-muted/40 flex h-full min-h-[220px] items-center justify-center rounded-lg">
            <p className="text-muted-foreground text-xs">{t("spot.chartLoading")}</p>
          </div>
        )}

        {chartReady && isLoading && (
          <div className="bg-muted/40 h-full min-h-[220px] w-full animate-pulse rounded-lg" />
        )}

        {chartReady && !isLoading && isError && (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg">
            <p className="text-muted-foreground text-xs">{t("spot.chartError")}</p>
          </div>
        )}

        {chartReady && !isLoading && !isError && bars.length === 0 && (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg">
            <p className="text-muted-foreground text-xs">{t("spot.chartEmpty")}</p>
          </div>
        )}

        {showChart && (
          <LightweightKlineChart
            bars={bars}
            enginePriceDecimal={enginePriceDecimal}
            chartType={chartType}
            secondsVisible={apiInterval === "1s"}
            className="rounded-lg"
          />
        )}
      </div>
    </section>
  );
}
