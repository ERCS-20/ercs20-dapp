import { getAuthSession } from "@/lib/auth/session";
import { request } from "@/lib/api/request";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import { SpotOrdersApi } from "@/services/spot/orders/paths";
import type { OrderSaltRsp } from "@/services/spot/orders/types";

/** Low 22-bit sequence max — matches `OrderIdGenerator.MAX_SEQUENCE`. */
const MAX_SEQUENCE = BigInt(4194303);
const SEQUENCE_MASK = BigInt(0x3fffff);

const STORAGE_KEY_PREFIX = "orbix.order-salt.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storageKey(): string {
  const userId = getAuthSession()?.userId;
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : `${STORAGE_KEY_PREFIX}:anonymous`;
}

function readCachedSalt(): bigint | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return null;
    return BigInt(raw);
  } catch {
    return null;
  }
}

function writeCachedSalt(salt: bigint): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey(), salt.toString());
}

async function fetchRemoteOrderSalt(): Promise<bigint> {
  const data = await request.post<{ salt: bigint | number | string }>(SpotOrdersApi.orderSalt);
  const salt = parseApiBigInt(data.salt);
  if (salt == null) {
    throw new Error("Invalid order salt from API");
  }
  return salt;
}

function sequencePart(salt: bigint): bigint {
  return salt & SEQUENCE_MASK;
}

async function allocateOrderSaltOnce(): Promise<OrderSaltRsp> {
  const cached = readCachedSalt();

  if (cached != null) {
    if (sequencePart(cached) < MAX_SEQUENCE) {
      const next = cached + BigInt(1);
      writeCachedSalt(next);
      return { salt: next.toString() };
    }
  }

  const remote = await fetchRemoteOrderSalt();
  writeCachedSalt(remote);
  return { salt: remote.toString() };
}

let allocateChain: Promise<OrderSaltRsp> | null = null;

/**
 * Allocate the next order/withdraw salt.
 * Uses local cache when the low 22-bit sequence is below 4194303; otherwise refetches from API.
 */
export async function allocateOrderSalt(): Promise<OrderSaltRsp> {
  if (typeof window === "undefined") {
    const remote = await fetchRemoteOrderSalt();
    return { salt: remote.toString() };
  }

  allocateChain ??= allocateOrderSaltOnce().finally(() => {
    allocateChain = null;
  });
  return allocateChain;
}
