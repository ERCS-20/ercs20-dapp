/** Slippage as basis points (e.g. 50 = 0.5%). Always returns at least 1 wei (choice A). */
export function minOutAfterSlippage(expectedOut: bigint, slippageBps: number): bigint {
  const zero = BigInt(0);
  const one = BigInt(1);
  if (expectedOut <= zero) return one;
  const bps = Math.min(10_000, Math.max(0, Math.floor(slippageBps)));
  const raw = (expectedOut * BigInt(10_000 - bps)) / BigInt(10_000);
  return raw < one ? one : raw;
}

export function swapDeadlineTimestamp(deadlineMinutes: number): bigint {
  const m = Math.min(24 * 60, Math.max(1, Math.floor(deadlineMinutes)));
  return BigInt(Math.floor(Date.now() / 1000) + m * 60);
}
