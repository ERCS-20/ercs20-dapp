export function shortTokenAddress(address: string): string {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortTxHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || "—";
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function shortRefId(ref: string): string {
  if (!ref) return "—";
  if (ref.length <= 14) return ref;
  return `${ref.slice(0, 8)}…${ref.slice(-4)}`;
}
