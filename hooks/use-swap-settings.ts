"use client";

import { useCallback, useState } from "react";

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

function initialSlippageBps(): number {
  if (typeof window === "undefined") return DEFAULT_SLIPPAGE_BPS;
  const s = readStored();
  if (typeof s.slippageBps === "number" && s.slippageBps >= 0 && s.slippageBps <= 5000) {
    return s.slippageBps;
  }
  return DEFAULT_SLIPPAGE_BPS;
}

function initialDeadlineMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_DEADLINE_MINUTES;
  const s = readStored();
  if (
    typeof s.deadlineMinutes === "number" &&
    s.deadlineMinutes >= 1 &&
    s.deadlineMinutes <= 24 * 60
  ) {
    return s.deadlineMinutes;
  }
  return DEFAULT_DEADLINE_MINUTES;
}

export function useSwapSettings() {
  const [slippageBps, setSlippageBps] = useState(initialSlippageBps);
  const [deadlineMinutes, setDeadlineMinutes] = useState(initialDeadlineMinutes);

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
