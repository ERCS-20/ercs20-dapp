"use client";

import { useEffect, useState } from "react";

import type { ChartInterval } from "@/lib/spot/chart-interval";
import { msUntilNextKlineBucket } from "@/lib/spot/kline-fill-gaps";

/**
 * Bumps on each kline bucket boundary so the chart can forward-fill empty
 * trailing bars without waiting for WS trades.
 */
export function useKlineLiveTick(
  interval: ChartInterval,
  enabled: boolean
): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = () => {
      const delay = msUntilNextKlineBucket(interval);
      timer = setTimeout(() => {
        if (cancelled) return;
        setTick((n) => n + 1);
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer != null) clearTimeout(timer);
    };
  }, [enabled, interval]);

  return tick;
}
