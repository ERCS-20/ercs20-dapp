/** Backend `KlineInterval` code. */
export type ChartInterval =
  | "1s"
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "1d"
  | "1w"
  | "1M"
  | "1y";

/** Toolbar selection: `time` = 分时折线；其余为蜡烛图周期。 */
export type ChartView = "time" | ChartInterval;

export type ChartType = "line" | "candle";

/** Default REST first-screen bar count (`kline-first-screen-limit`). */
export const KLINE_FIRST_SCREEN_LIMIT = 200;

export const DEFAULT_CHART_VIEW: ChartView = "15m";

/**
 * 分时用 1m close 连线（首屏约覆盖数小时）。
 * 若改用 1s，limit=200 大约只覆盖 3 分钟。
 */
export const TIME_SHARE_API_INTERVAL: ChartInterval = "1m";

export const CHART_INTERVAL_OPTIONS: {
  view: ChartView;
  label: string;
  chartType: ChartType;
}[] = [
  { view: "time", label: "分时", chartType: "line" },
  { view: "1s", label: "1s", chartType: "candle" },
  { view: "1m", label: "1m", chartType: "candle" },
  { view: "5m", label: "5m", chartType: "candle" },
  { view: "15m", label: "15m", chartType: "candle" },
  { view: "30m", label: "30m", chartType: "candle" },
  { view: "1h", label: "1h", chartType: "candle" },
  { view: "2h", label: "2h", chartType: "candle" },
  { view: "1d", label: "1D", chartType: "candle" },
  { view: "1w", label: "1W", chartType: "candle" },
  { view: "1M", label: "1M", chartType: "candle" },
  { view: "1y", label: "1Y", chartType: "candle" },
];

/** Intervals shown inline under the chart; the rest open via the more menu. */
export const PRIMARY_CHART_VIEWS: ChartView[] = ["time", "15m", "2h", "1d"];

export function chartViewLabel(view: ChartView): string {
  return CHART_INTERVAL_OPTIONS.find((option) => option.view === view)?.label ?? view;
}

export function resolveChartRequest(view: ChartView): {
  apiInterval: ChartInterval;
  chartType: ChartType;
} {
  if (view === "time") {
    return { apiInterval: TIME_SHARE_API_INTERVAL, chartType: "line" };
  }
  return { apiInterval: view, chartType: "candle" };
}
