import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";

const STORAGE_KEY = "ercs20-token-cache-v1";

function readAll(): Ercs20TokenMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is Ercs20TokenMeta =>
        typeof x === "object" &&
        x != null &&
        typeof (x as Ercs20TokenMeta).address === "string" &&
        typeof (x as Ercs20TokenMeta).symbol === "string" &&
        typeof (x as Ercs20TokenMeta).name === "string"
    );
  } catch {
    return [];
  }
}

function writeAll(items: Ercs20TokenMeta[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCachedErcs20Tokens(): Ercs20TokenMeta[] {
  return readAll();
}

export function cacheErcs20Token(meta: Ercs20TokenMeta) {
  const lower = meta.address.toLowerCase();
  const list = readAll().filter((t) => t.address.toLowerCase() !== lower);
  list.unshift(meta);
  writeAll(list.slice(0, 200));
}

export function searchCachedErcs20Tokens(query: string): Ercs20TokenMeta[] {
  if (!query) return [];
  return readAll().filter(
    (t) =>
      t.symbol.includes(query) ||
      t.name.includes(query) ||
      t.address.toLowerCase().includes(query.toLowerCase())
  );
}
