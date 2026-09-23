import type { ChartView } from "@/lib/market/chart-interval";
import {
  readCachedChartView as read,
  writeCachedChartView as write,
} from "@/lib/market/cached-chart-view";

export function readCachedChartView(): ChartView {
  return read("perps");
}

export function writeCachedChartView(view: ChartView): void {
  write("perps", view);
}
