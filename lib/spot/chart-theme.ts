export type SpotChartTheme = {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
};

/**
 * Hex/rgba palettes aligned with `app/globals.css` (:root / .dark).
 * Background is transparent so the parent `bg-card` shows through — same surface
 * as pairs / order book / orders cards (no elevated paint).
 * Do not sample CSS vars on theme toggle — `resolvedTheme` can update before
 * the `dark` class is on `<html>`.
 */
const LIGHT: SpotChartTheme = {
  background: "rgba(0, 0, 0, 0)",
  text: "#6b6b6b",
  grid: "#e4e4e4",
  up: "#00d1b2",
  down: "#f06292",
};

const DARK: SpotChartTheme = {
  background: "rgba(0, 0, 0, 0)",
  text: "#9a9a9a",
  grid: "rgba(255, 255, 255, 0.14)",
  up: "#00d1b2",
  down: "#f06292",
};

/** Resolve chart colors from next-themes `resolvedTheme` (or DOM class as fallback). */
export function readSpotChartTheme(mode?: string | null): SpotChartTheme {
  if (mode === "dark") return DARK;
  if (mode === "light") return LIGHT;

  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark") ? DARK : LIGHT;
  }

  return LIGHT;
}
