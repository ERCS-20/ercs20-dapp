"use client";

import { useCallback, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "ercs20-swap-settings-v1";

export const DEFAULT_SLIPPAGE_BPS = 50;
export const DEFAULT_DEADLINE_MINUTES = 20;

type Stored = {
  slippageBps: number;
  deadlineMinutes: number;
};

function parseSlippageBps(raw: unknown): number | undefined {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.trunc(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 5000) return undefined;
  return n;
}

function parseDeadlineMinutes(raw: unknown): number | undefined {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.trunc(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 24 * 60) return undefined;
  return n;
}

function readStored(): Partial<Stored> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const slippageBps = parseSlippageBps(o.slippageBps);
    const deadlineMinutes = parseDeadlineMinutes(o.deadlineMinutes);
    const out: Partial<Stored> = {};
    if (slippageBps !== undefined) out.slippageBps = slippageBps;
    if (deadlineMinutes !== undefined) out.deadlineMinutes = deadlineMinutes;
    return out;
  } catch {
    return {};
  }
}

export function useSwapSettings() {
  /** Defaults on server + first client paint so SSR HTML matches hydration (no localStorage in initial state). */
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [deadlineMinutes, setDeadlineMinutes] = useState(DEFAULT_DEADLINE_MINUTES);

  /** Layout effect: restore before paint so opening settings on first interaction sees stored values, not defaults. */
  useLayoutEffect(() => {
    const s = readStored();
    if (s.slippageBps !== undefined) setSlippageBps(s.slippageBps);
    if (s.deadlineMinutes !== undefined) setDeadlineMinutes(s.deadlineMinutes);
  }, []);

  /** Pass `next` when saving right after `setState` — the hook state is still stale in the same tick. */
  const persist = useCallback(
    (next?: Partial<Stored>) => {
      if (typeof window === "undefined") return;
      const payload: Stored = {
        slippageBps: next?.slippageBps ?? slippageBps,
        deadlineMinutes: next?.deadlineMinutes ?? deadlineMinutes,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    [slippageBps, deadlineMinutes]
  );

  return {
    slippageBps,
    setSlippageBps,
    deadlineMinutes,
    setDeadlineMinutes,
    persist,
  };
}
