import {
  CHART_INTERVAL_OPTIONS,
  DEFAULT_CHART_VIEW,
  type ChartView,
} from "@/lib/market/chart-interval";

const VALID_VIEWS = new Set<ChartView>(
  CHART_INTERVAL_OPTIONS.map((option) => option.view)
);

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storageKey(product: "spot" | "perps"): string {
  return product === "spot" ? "orbix.spot.chartView" : "orbix.perps.chartView";
}

export function readCachedChartView(product: "spot" | "perps"): ChartView {
  if (!canUseStorage()) return DEFAULT_CHART_VIEW;
  try {
    const raw = window.localStorage.getItem(storageKey(product));
    if (raw && VALID_VIEWS.has(raw as ChartView)) {
      return raw as ChartView;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CHART_VIEW;
}

export function writeCachedChartView(
  product: "spot" | "perps",
  view: ChartView
): void {
  if (!canUseStorage()) return;
  if (!VALID_VIEWS.has(view)) return;
  try {
    window.localStorage.setItem(storageKey(product), view);
  } catch {
    /* ignore */
  }
}
