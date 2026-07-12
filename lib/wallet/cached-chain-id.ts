const STORAGE_KEY = "orbix.wallet.chainId";

export function getCachedChainId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
  } catch {
    return undefined;
  }
}

export function setCachedChainId(chainId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(chainId) || chainId <= 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Math.trunc(chainId)));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCachedChainId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
