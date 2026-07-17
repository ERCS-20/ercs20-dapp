"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import type { ChartType } from "@/lib/spot/chart-interval";
import { readSpotChartTheme } from "@/lib/spot/chart-theme";
import { marketKlinesToChartSeries } from "@/lib/spot/kline-to-chart";
import { cn } from "@/lib/utils";
import type { MarketKlineRsp } from "@/services/spot/market/types";

type CandleSeries = ISeriesApi<"Candlestick">;
type LineSeriesApi = ISeriesApi<"Line">;
type VolumeSeries = ISeriesApi<"Histogram">;

/** Keep candle/line width stable even when the pair only has 1–2 bars. */
const BAR_SPACING = 8;
const MIN_BAR_SPACING = 3;
/** How many bar slots the viewport should cover (empty slots stay blank on the left). */
const VISIBLE_BAR_SLOTS = 80;
const RIGHT_OFFSET_BARS = 8;

function applyStableVisibleRange(chart: IChartApi, barCount: number) {
  if (barCount <= 0) return;
  const to = barCount - 1 + RIGHT_OFFSET_BARS;
  const from = to - VISIBLE_BAR_SLOTS;
  chart.timeScale().setVisibleLogicalRange({ from, to });
}

export function LightweightKlineChart({
  bars,
  enginePriceDecimal,
  chartType,
  secondsVisible,
  className,
}: {
  bars: MarketKlineRsp[];
  enginePriceDecimal: number;
  chartType: ChartType;
  secondsVisible?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<CandleSeries | null>(null);
  const lineRef = useRef<LineSeriesApi | null>(null);
  const volumeRef = useRef<VolumeSeries | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const theme = readSpotChartTheme();
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: {
        borderColor: theme.grid,
        scaleMargins: { top: 0.05, bottom: 0.24 },
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
    });

    const line = chart.addSeries(LineSeries, {
      color: theme.up,
      lineWidth: 2,
      visible: chartType === "line",
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candles;
    lineRef.current = line;
    volumeRef.current = volume;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
    };
  }, [chartType, secondsVisible]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleRef.current;
    const lineSeries = lineRef.current;
    const volumeSeries = volumeRef.current;
    if (!chart || !candleSeries || !lineSeries || !volumeSeries) return;

    const theme = readSpotChartTheme();
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
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

    candleSeries.applyOptions({
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      visible: chartType === "candle",
    });

    lineSeries.applyOptions({
      color: theme.up,
      lineWidth: 2,
      visible: chartType === "line",
    });

    const { candles, volumes, line } = marketKlinesToChartSeries(
      bars,
      enginePriceDecimal,
      { up: theme.up, down: theme.down }
    );

    candleSeries.setData(chartType === "candle" ? candles : []);
    lineSeries.setData(chartType === "line" ? line : []);
    volumeSeries.setData(volumes);
    // Do not use fitContent(): with 1–2 bars it stretches series across the whole width.
    applyStableVisibleRange(chart, chartType === "line" ? line.length : candles.length);
  }, [bars, enginePriceDecimal, chartType, secondsVisible, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full min-h-[220px] w-full", className)}
      aria-hidden
    />
  );
}
