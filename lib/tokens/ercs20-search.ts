import type { PublicClient } from "viem";
import { isAddress, zeroAddress } from "viem";

import { ercs20FactoryAbi } from "@/lib/contracts/ercs20-factory-abi";
import {
  assertValidErcs20Address,
  readErcs20TokenMeta,
} from "@/lib/tokens/ercs20-meta";
import {
  cacheErcs20Token,
  getCachedErcs20Tokens,
  searchCachedErcs20Tokens,
} from "@/lib/tokens/ercs20-cache";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";

import defaultListJson from "@/lib/tokens/ercs20-default-list.json";

type DefaultRow = { address: string; symbol: string; name: string };

const defaultList = defaultListJson as DefaultRow[];

function uniqByAddress(items: Ercs20TokenMeta[]): Ercs20TokenMeta[] {
  const seen = new Set<string>();
  const out: Ercs20TokenMeta[] = [];
  for (const t of items) {
    const k = t.address.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function searchDefaultList(query: string): Ercs20TokenMeta[] {
  if (!query) return [];
  const out: Ercs20TokenMeta[] = [];
  for (const row of defaultList) {
    if (!row.address?.startsWith("0x")) continue;
    const sym = row.symbol ?? "";
    const addr = row.address.toLowerCase();
    if (sym.includes(query) || addr === query.toLowerCase()) {
      out.push({
        address: row.address as `0x${string}`,
        symbol: sym,
        name: row.name ?? sym,
      });
    }
  }
  return out;
}

/**
 * Search: default JSON → cache → (address + ercs20s) → factory.symbols(raw query).
 */
export async function searchErcs20Tokens(
  client: PublicClient,
  factory: `0x${string}`,
  query: string
): Promise<Ercs20TokenMeta[]> {
  if (!query) return [];

  const collected: Ercs20TokenMeta[] = [];

  collected.push(...searchDefaultList(query));
  collected.push(...searchCachedErcs20Tokens(query));

  const asAddr = assertValidErcs20Address(query);
  if (asAddr) {
    const ok = await client.readContract({
      address: factory,
      abi: ercs20FactoryAbi,
      functionName: "ercs20s",
      args: [asAddr],
    });
    if (ok) {
      const meta = await readErcs20TokenMeta(client, asAddr);
      cacheErcs20Token(meta);
      collected.push(meta);
    }
  } else {
    const resolved = await client.readContract({
      address: factory,
      abi: ercs20FactoryAbi,
      functionName: "symbols",
      args: [query],
    });
    if (
      resolved &&
      resolved !== zeroAddress &&
      isAddress(resolved)
    ) {
      const meta = await readErcs20TokenMeta(client, resolved);
      cacheErcs20Token(meta);
      collected.push(meta);
    }
  }

  return uniqByAddress(collected);
}

export function getDefaultListTokens(): Ercs20TokenMeta[] {
  return defaultList
    .filter((row) => row.address?.startsWith("0x"))
    .map((row) => ({
      address: row.address as `0x${string}`,
      symbol: row.symbol ?? "",
      name: row.name ?? row.symbol ?? "",
    }));
}

/** Default JSON + cache, deduped (browse when search is empty). */
export function listBrowseableErcs20Tokens(): Ercs20TokenMeta[] {
  const m = new Map<string, Ercs20TokenMeta>();
  for (const t of getDefaultListTokens()) m.set(t.address.toLowerCase(), t);
  for (const t of getCachedErcs20Tokens()) m.set(t.address.toLowerCase(), t);
  return [...m.values()];
}

/** Match `NEXT_PUBLIC_DEFAULT_ERCS20_TOKEN` etc. to browse list / cache for UI label before RPC. */
export function findErcs20ListMetaByAddress(
  address: string | undefined
): Ercs20TokenMeta | undefined {
  if (!address?.startsWith("0x")) return undefined;
  const key = address.toLowerCase();
  for (const t of getDefaultListTokens()) {
    if (t.address.toLowerCase() === key) return t;
  }
  for (const t of getCachedErcs20Tokens()) {
    if (t.address.toLowerCase() === key) return t;
  }
  return undefined;
}
