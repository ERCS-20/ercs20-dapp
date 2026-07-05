import type { Ercs20Req } from "@/services/chain/types";

export function buildErcs20SearchCondition(query: string): Ercs20Req | undefined {
  const q = query.trim();
  if (!q) return undefined;
  if (/^0x[a-fA-F0-9]{40}$/.test(q)) {
    return { contractAddress: q };
  }
  return { symbol: q };
}
