"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import {
  loadSwapSettingsStorage,
  saveSwapSettingsStorage,
} from "@/lib/storage/local-storage";

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
  const o = loadSwapSettingsStorage<Record<string, unknown>>();
  if (!o) return {};
  const slippageBps = parseSlippageBps(o.slippageBps);
  const deadlineMinutes = parseDeadlineMinutes(o.deadlineMinutes);
  const out: Partial<Stored> = {};
  if (slippageBps !== undefined) out.slippageBps = slippageBps;
  if (deadlineMinutes !== undefined) out.deadlineMinutes = deadlineMinutes;
  return out;
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
      const payload: Stored = {
        slippageBps: next?.slippageBps ?? slippageBps,
        deadlineMinutes: next?.deadlineMinutes ?? deadlineMinutes,
      };
      saveSwapSettingsStorage(payload);
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
