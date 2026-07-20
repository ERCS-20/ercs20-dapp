"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import type { ChartType } from "@/lib/spot/chart-interval";
import { readSpotChartTheme } from "@/lib/spot/chart-theme";
import { marketKlinesToChartSeries } from "@/lib/spot/kline-to-chart";
import { cn } from "@/lib/utils";
import { formatSubscriptPrice } from "@/lib/utils/price";
import type { MarketKlineRsp } from "@/services/spot/market/types";

type CandleSeries = ISeriesApi<"Candlestick">;
type LineSeriesApi = ISeriesApi<"Line">;
type VolumeSeries = ISeriesApi<"Histogram">;

/**
 * Fixed candle width (px between bars), same idea as Binance/OKX:
 * wider viewport → more candles, not fatter candles.
 */
const BAR_SPACING = 8;
const MIN_BAR_SPACING = 3;
const RIGHT_OFFSET_BARS = 8;
/** Main pane vs volume pane stretch (≈ 75% / 25%). */
const MAIN_PANE_STRETCH = 3;
const VOLUME_PANE_STRETCH = 1;

/**
 * Default chart priceFormat is precision=2 / minMove=0.01 — tiny quote prices
 * all round to "0.00" on the right axis. Use engine decimals + subscript UI format.
 */
function chartPriceFormat(enginePriceDecimal: number) {
  const decimal = Math.max(0, Math.min(Math.trunc(enginePriceDecimal), 18));
  const base = decimal === 0 ? 1 : 10 ** decimal;
  return {
    type: "custom" as const,
    minMove: 1 / base,
    base,
    formatter: (price: number) => formatSubscriptPrice(price, decimal),
  };
}

function crosshairTimeSec(param: MouseEventParams): number | null {
  if (param.point === undefined || param.time === undefined) return null;
  return typeof param.time === "number" ? param.time : null;
}

export function LightweightKlineChart({
  bars,
  enginePriceDecimal,
  chartType,
  secondsVisible,
  seriesKey,
  onCrosshairTimeChange,
  className,
}: {
  bars: MarketKlineRsp[];
  enginePriceDecimal: number;
  chartType: ChartType;
  secondsVisible?: boolean;
  /** Change when pair/interval switches — scroll to latest once (not on every WS tick). */
  seriesKey?: string;
  /** UTC seconds of hovered bar; `null` when crosshair leaves data. */
  onCrosshairTimeChange?: (timeSec: number | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<CandleSeries | null>(null);
  const lineRef = useRef<LineSeriesApi | null>(null);
  const volumeRef = useRef<VolumeSeries | null>(null);
  const onCrosshairTimeChangeRef = useRef(onCrosshairTimeChange);
  /** Skip re-scrolling when only theme/colors refresh or live bar updates. */
  const shouldScrollToLatestRef = useRef(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    onCrosshairTimeChangeRef.current = onCrosshairTimeChange;
  }, [onCrosshairTimeChange]);

  useEffect(() => {
    shouldScrollToLatestRef.current = true;
  }, [seriesKey, chartType, secondsVisible]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const theme = readSpotChartTheme(resolvedTheme);
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
        attributionLogo: true,
        panes: {
          separatorColor: theme.grid,
          separatorHoverColor: theme.grid,
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: {
        borderColor: theme.grid,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: theme.grid,
        timeVisible: true,
        secondsVisible: Boolean(secondsVisible),
        barSpacing: BAR_SPACING,
        minBarSpacing: MIN_BAR_SPACING,
        rightOffset: RIGHT_OFFSET_BARS,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      crosshair: {
        vertLine: { color: theme.text },
        horzLine: { color: theme.text },
      },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      visible: chartType === "candle",
      priceFormat: chartPriceFormat(0),
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const line = chart.addSeries(LineSeries, {
      color: theme.up,
      lineWidth: 2,
      visible: chartType === "line",
      priceFormat: chartPriceFormat(0),
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Separate volume pane so height is readable; pane separator draws the divider.
    const volumePane = chart.addPane(true);
    const volume = volumePane.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chart.panes()[0]?.setStretchFactor(MAIN_PANE_STRETCH);
    volumePane.setStretchFactor(VOLUME_PANE_STRETCH);

    volume.priceScale().applyOptions({
      borderColor: theme.grid,
      scaleMargins: { top: 0.08, bottom: 0 },
    });

    const onCrosshairMove = (param: MouseEventParams) => {
      onCrosshairTimeChangeRef.current?.(crosshairTimeSec(param));
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    chartRef.current = chart;
    candleRef.current = candles;
    lineRef.current = line;
    volumeRef.current = volume;

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
      onCrosshairTimeChangeRef.current?.(null);
    };
  }, [chartType, secondsVisible]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleRef.current;
    const lineSeries = lineRef.current;
    const volumeSeries = volumeRef.current;
    if (!chart || !candleSeries || !lineSeries || !volumeSeries) return;

    const theme = readSpotChartTheme(resolvedTheme);
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
        panes: {
          separatorColor: theme.grid,
          separatorHoverColor: theme.grid,
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: { borderColor: theme.grid },
      timeScale: {
        borderColor: theme.grid,
        secondsVisible: Boolean(secondsVisible),
        barSpacing: BAR_SPACING,
        minBarSpacing: MIN_BAR_SPACING,
        rightOffset: RIGHT_OFFSET_BARS,
      },
    });

    const priceFormat = chartPriceFormat(enginePriceDecimal);

    candleSeries.applyOptions({
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      visible: chartType === "candle",
      priceFormat,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    lineSeries.applyOptions({
      color: theme.up,
      lineWidth: 2,
      visible: chartType === "line",
      priceFormat,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    volumeSeries.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      borderColor: theme.grid,
      scaleMargins: { top: 0.08, bottom: 0 },
    });

    const { candles, volumes, line } = marketKlinesToChartSeries(
      bars,
      enginePriceDecimal,
      { up: theme.up, down: theme.down }
    );

    candleSeries.setData(chartType === "candle" ? candles : []);
    lineSeries.setData(chartType === "line" ? line : []);
    volumeSeries.setData(volumes);

    // Keep barSpacing; scroll to latest. Do not fitContent() — that stretches candles.
    if (shouldScrollToLatestRef.current) {
      chart.timeScale().scrollToRealTime();
      shouldScrollToLatestRef.current = false;
    }
  }, [bars, enginePriceDecimal, chartType, secondsVisible, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full min-h-[220px] w-full", className)}
      aria-hidden
    />
  );
}
