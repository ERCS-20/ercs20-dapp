export type SpotChartTheme = {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
};

const FALLBACK: SpotChartTheme = {
  background: "#ffffff",
  text: "#737373",
  grid: "#e5e5e5",
  up: "#00d1b2",
  down: "#f06292",
};

let probeCtx: CanvasRenderingContext2D | null = null;

function getProbeContext(): CanvasRenderingContext2D | null {
  if (probeCtx) return probeCtx;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  probeCtx = canvas.getContext("2d", { willReadFrequently: true });
  return probeCtx;
}

/**
 * lightweight-charts only accepts hex / rgb(a).
 * Modern browsers serialize computed CSS colors as `lab()` / `oklch()`, so convert via canvas.
 */
function cssColorToRgb(color: string, fallback: string): string {
  const trimmed = color.trim();
  if (!trimmed) return fallback;
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed) || /^rgba?\(/i.test(trimmed)) {
    return trimmed;
  }

  const ctx = getProbeContext();
  if (!ctx) return fallback;

  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillStyle = trimmed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return fallback;
    if (a === 255) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
  } catch {
    return fallback;
  }
}

/** Read Orbix CSS tokens for lightweight-charts (canvas needs resolved rgb/hex). */
export function readSpotChartTheme(): SpotChartTheme {
  if (typeof window === "undefined") {
    return FALLBACK;
  }

  const root = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) =>
    cssColorToRgb(root.getPropertyValue(name), fallback);

  return {
    background: pick("--card", pick("--background", FALLBACK.background)),
    text: pick("--muted-foreground", FALLBACK.text),
    grid: pick("--border", FALLBACK.grid),
    up: pick("--brand-accent", FALLBACK.up),
    down: pick("--brand-accent-alt", FALLBACK.down),
  };
}
