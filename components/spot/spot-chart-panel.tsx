"use client";

import dynamic from "next/dynamic";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import {
  CHART_INTERVAL_OPTIONS,
  chartViewLabel,
  KLINE_FIRST_SCREEN_LIMIT,
  PRIMARY_CHART_VIEWS,
  resolveChartRequest,
  type ChartView,
} from "@/lib/spot/chart-interval";
import { cn } from "@/lib/utils";
import { formatBalance } from "@/lib/utils/format/balance";
import { formatPercentChange, formatSubscriptPrice } from "@/lib/utils/price";
import { useI18n } from "@/providers/i18n-provider";
import { useKlineList } from "@/services/spot/market/hooks";
import type { MarketKlineRsp } from "@/services/spot/market/types";

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

const PRIMARY_OPTIONS = CHART_INTERVAL_OPTIONS.filter((option) =>
  PRIMARY_CHART_VIEWS.includes(option.view)
);

function intervalButtonClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
    active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:text-foreground"
  );
}

function latestBarStats(bar: MarketKlineRsp | undefined, enginePriceDecimal: number) {
  if (!bar) return null;

  const open = enginePriceToNumber(bar.open, enginePriceDecimal);
  const high = enginePriceToNumber(bar.high, enginePriceDecimal);
  const low = enginePriceToNumber(bar.low, enginePriceDecimal);
  const close = enginePriceToNumber(bar.close, enginePriceDecimal);
  const changePct = open === 0 ? 0 : ((close - open) / open) * 100;
  const amplitudePct = open === 0 ? 0 : ((high - low) / open) * 100;

  return { open, high, low, close, changePct, amplitudePct };
}

function ChartOhlcStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", valueClassName)}>{value}</span>
    </span>
  );
}

export function SpotChartPanel({
  pairId,
  enginePriceDecimal,
  baseSymbol,
  quoteSymbol,
  view,
  onViewChange,
  className,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  baseSymbol: string;
  quoteSymbol: string;
  view: ChartView;
  onViewChange: (view: ChartView) => void;
  className?: string;
}) {
  const { t } = useI18n();

  const { apiInterval, chartType } = useMemo(
    () => resolveChartRequest(view),
    [view]
  );

  const isPrimaryView = PRIMARY_CHART_VIEWS.includes(view);

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

  const [hoverTimeSec, setHoverTimeSec] = useState<number | null>(null);

  useEffect(() => {
    setHoverTimeSec(null);
  }, [pairId, view]);

  const handleCrosshairTimeChange = useCallback((timeSec: number | null) => {
    setHoverTimeSec(timeSec);
  }, []);

  const barsByTimeSec = useMemo(() => {
    const map = new Map<number, MarketKlineRsp>();
    for (const bar of bars) {
      map.set(Math.floor(bar.openTime / 1000), bar);
    }
    return map;
  }, [bars]);

  const activeBar = useMemo(() => {
    if (bars.length === 0) return undefined;
    if (hoverTimeSec != null) {
      return barsByTimeSec.get(hoverTimeSec) ?? bars[bars.length - 1];
    }
    return bars[bars.length - 1];
  }, [bars, barsByTimeSec, hoverTimeSec]);

  const ohlc = useMemo(() => {
    if (enginePriceDecimal == null || !activeBar) return null;
    return latestBarStats(activeBar, enginePriceDecimal);
  }, [activeBar, enginePriceDecimal]);

  const volumeStats = useMemo(() => {
    if (!activeBar || enginePriceDecimal == null) return null;
    return {
      baseVolume: formatBalance(activeBar.baseVolume, 18),
      // quoteVolume = enginePrice × quantity → scale 18 + enginePriceDecimal
      quoteVolume: formatBalance(
        activeBar.quoteVolume,
        18 + enginePriceDecimal
      ),
      tradeCount: activeBar.tradeCount,
      up:
        enginePriceToNumber(activeBar.close, enginePriceDecimal) >=
        enginePriceToNumber(activeBar.open, enginePriceDecimal),
    };
  }, [activeBar, enginePriceDecimal]);

  const changeTone =
    ohlc == null
      ? undefined
      : ohlc.changePct >= 0
        ? "text-brand"
        : "text-brand-alt";

  const volTone = volumeStats?.up ? "text-brand" : "text-brand-alt";

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex min-h-[280px] flex-col overflow-hidden rounded-xl border lg:min-h-[420px]",
        className
      )}
      aria-label={t("spot.chart")}
    >
      <div className="border-border/60 flex items-center border-b px-3 py-2 sm:px-4">
        <span className="text-foreground text-sm font-medium">{t("spot.chart")}</span>
      </div>

      <div className="border-border/60 flex items-center gap-2 border-b px-2 py-1.5 sm:gap-3 sm:px-3">
        <div className="flex min-w-0 shrink-0 items-center gap-0.5">
          {PRIMARY_OPTIONS.map((option) => (
            <button
              key={option.view}
              type="button"
              onClick={() => onViewChange(option.view)}
              className={intervalButtonClass(view === option.view)}
            >
              {option.label}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  intervalButtonClass(!isPrimaryView),
                  "inline-flex items-center gap-1"
                )}
                aria-label={t("spot.chartMoreIntervals")}
              >
                {!isPrimaryView ? chartViewLabel(view) : null}
                <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-28">
              <DropdownMenuRadioGroup
                value={view}
                onValueChange={(value) => onViewChange(value as ChartView)}
              >
                {CHART_INTERVAL_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.view} value={option.view}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {ohlc && enginePriceDecimal != null ? (
          <div className="text-muted-foreground ml-auto hidden min-w-0 items-center justify-end gap-x-3 overflow-x-auto text-[11px] sm:flex sm:text-xs">
            <ChartOhlcStat
              label={t("spot.chartOpen")}
              value={formatSubscriptPrice(ohlc.open, enginePriceDecimal)}
              valueClassName="text-foreground"
            />
            <ChartOhlcStat
              label={t("spot.chartHigh")}
              value={formatSubscriptPrice(ohlc.high, enginePriceDecimal)}
              valueClassName="text-foreground"
            />
            <ChartOhlcStat
              label={t("spot.chartLow")}
              value={formatSubscriptPrice(ohlc.low, enginePriceDecimal)}
              valueClassName="text-foreground"
            />
            <ChartOhlcStat
              label={t("spot.chartClose")}
              value={formatSubscriptPrice(ohlc.close, enginePriceDecimal)}
              valueClassName="text-foreground"
            />
            <ChartOhlcStat
              label={t("spot.chartChange")}
              value={formatPercentChange(ohlc.changePct)}
              valueClassName={changeTone}
            />
            <ChartOhlcStat
              label={t("spot.chartAmplitude")}
              value={`${ohlc.amplitudePct.toFixed(2)}%`}
              valueClassName="text-foreground"
            />
          </div>
        ) : null}
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
          <>
            <LightweightKlineChart
              bars={bars}
              enginePriceDecimal={enginePriceDecimal}
              chartType={chartType}
              secondsVisible={apiInterval === "1s"}
              onCrosshairTimeChange={handleCrosshairTimeChange}
              className="rounded-lg"
            />
            {volumeStats ? (
              <div
                className="pointer-events-none absolute top-[78%] left-3 z-10 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] sm:left-4 sm:text-xs"
                aria-hidden
              >
                <ChartOhlcStat
                  label={t("spot.chartVol").replace("{symbol}", baseSymbol)}
                  value={volumeStats.baseVolume}
                  valueClassName={volTone}
                />
                <ChartOhlcStat
                  label={t("spot.chartVol").replace("{symbol}", quoteSymbol)}
                  value={volumeStats.quoteVolume}
                  valueClassName={volTone}
                />
                <ChartOhlcStat
                  label={t("spot.chartCount")}
                  value={String(volumeStats.tradeCount)}
                  valueClassName="text-foreground"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
