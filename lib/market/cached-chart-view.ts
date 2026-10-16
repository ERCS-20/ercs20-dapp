import {
  CHART_INTERVAL_OPTIONS,
  DEFAULT_CHART_VIEW,
  type ChartView,
} from "@/lib/market/chart-interval";
import {
  loadChartViewStorage,
  saveChartViewStorage,
} from "@/lib/storage/local-storage";

const VALID_VIEWS = new Set<ChartView>(
  CHART_INTERVAL_OPTIONS.map((option) => option.view)
);

export function readCachedChartView(product: "spot" | "perps"): ChartView {
  const raw = loadChartViewStorage(product);
  if (raw && VALID_VIEWS.has(raw as ChartView)) {
    return raw as ChartView;
  }
  return DEFAULT_CHART_VIEW;
}

export function writeCachedChartView(
  product: "spot" | "perps",
  view: ChartView
): void {
  if (!VALID_VIEWS.has(view)) return;
  saveChartViewStorage(product, view);
}
