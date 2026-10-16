/** Low 22-bit sequence max — matches OrderIdGenerator.MAX_SEQUENCE. */
const MAX_SEQUENCE = BigInt(4194303);
const SEQUENCE_MASK = BigInt(0x3fffff);

function sequencePart(salt: bigint): bigint {
  return salt & SEQUENCE_MASK;
}

/**
 * Next salt from local cache when the low 22-bit sequence allows; otherwise fetch remote.
 */
export async function allocateCachedSalt(options: {
  readCached: () => bigint | null;
  writeCached: (salt: bigint) => void;
  fetchRemote: () => Promise<bigint>;
}): Promise<{ salt: string }> {
  const cached = options.readCached();
  if (cached != null && sequencePart(cached) < MAX_SEQUENCE) {
    const next = cached + BigInt(1);
    options.writeCached(next);
    return { salt: next.toString() };
  }

  const remote = await options.fetchRemote();
  options.writeCached(remote);
  return { salt: remote.toString() };
}
