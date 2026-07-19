import {
  CHART_INTERVAL_OPTIONS,
  DEFAULT_CHART_VIEW,
  type ChartView,
} from "@/lib/spot/chart-interval";

const STORAGE_KEY = "orbix.spot.chartView";

const VALID_VIEWS = new Set<ChartView>(
  CHART_INTERVAL_OPTIONS.map((option) => option.view)
);

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCachedChartView(): ChartView {
  if (!canUseStorage()) return DEFAULT_CHART_VIEW;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_VIEWS.has(raw as ChartView)) {
      return raw as ChartView;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CHART_VIEW;
}

export function writeCachedChartView(view: ChartView): void {
  if (!canUseStorage()) return;
  if (!VALID_VIEWS.has(view)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}
