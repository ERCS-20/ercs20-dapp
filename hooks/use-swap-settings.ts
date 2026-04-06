"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ercs20-swap-settings-v1";

export const DEFAULT_SLIPPAGE_BPS = 50;
export const DEFAULT_DEADLINE_MINUTES = 20;

type Stored = {
  slippageBps: number;
  deadlineMinutes: number;
};

function readStored(): Partial<Stored> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Stored;
  } catch {
    return {};
  }
}

export function useSwapSettings() {
  /** Defaults on server + first client paint so SSR HTML matches hydration (no localStorage in initial state). */
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [deadlineMinutes, setDeadlineMinutes] = useState(DEFAULT_DEADLINE_MINUTES);

  useEffect(() => {
    const s = readStored();
    if (
      typeof s.slippageBps === "number" &&
      s.slippageBps >= 0 &&
      s.slippageBps <= 5000
    ) {
      setSlippageBps(s.slippageBps);
    }
    if (
      typeof s.deadlineMinutes === "number" &&
      s.deadlineMinutes >= 1 &&
      s.deadlineMinutes <= 24 * 60
    ) {
      setDeadlineMinutes(s.deadlineMinutes);
    }
  }, []);

  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload: Stored = { slippageBps, deadlineMinutes };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [slippageBps, deadlineMinutes]);

  return {
    slippageBps,
    setSlippageBps,
    deadlineMinutes,
    setDeadlineMinutes,
    persist,
  };
}
