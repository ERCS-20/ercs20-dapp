import { parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Chain sample cursor. A higher block wins; the same block uses `blockLogIndex`. */
export type BlockCursor = {
  blockNumber: ApiBigInt;
  blockLogIndex: number;
};

function readCursor(
  sample: BlockCursor | null | undefined
): { block: bigint; logIndex: number } | null {
  if (sample == null) return null;
  const block = parseApiBigInt(sample.blockNumber);
  if (block == null || !Number.isInteger(sample.blockLogIndex)) return null;
  return { block, logIndex: sample.blockLogIndex };
}

/** True when `incoming` should replace `cached`. Missing cache counts as older. */
export function isNewerBlockCursor(
  incoming: BlockCursor | null | undefined,
  cached: BlockCursor | null | undefined
): boolean {
  const next = readCursor(incoming);
  if (!next) return false;
  const prev = readCursor(cached);
  if (!prev) return true;
  if (next.block !== prev.block) return next.block > prev.block;
  return next.logIndex > prev.logIndex;
}
