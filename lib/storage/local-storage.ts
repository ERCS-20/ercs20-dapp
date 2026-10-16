/**
 * Unified localStorage service for the dApp.
 *
 * Keys stay private. Callers use named methods below — see {@link LocalStorageCatalog}
 * for the full inventory of persisted client state.
 */

const Keys = {
  authSession: "orbix.exchange.auth.session",
  locale: "ercs20-locale",
  swapSettings: "ercs20-swap-settings-v1",
  ercs20TokenCache: "ercs20-token-cache-v1",
  perpsLeverage: "orbix.perps.leverage",
  spotChartView: "orbix.spot.chartView",
  perpsChartView: "orbix.perps.chartView",
} as const;

const KeyPrefixes = {
  spotOrderSalt: "orbix.order-salt.v1",
  perpsOrderSalt: "orbix.perps-order-salt.v1",
  spotUserBalancesId: "orbix.spot.user-balances-id.v1",
  perpsUserBalancesId: "orbix.perps.user-balances-id.v1",
} as const;

/** Human-readable inventory of every localStorage entry this app owns. */
export const LocalStorageCatalog: ReadonlyArray<{
  key: string;
  description: string;
  scopedByUser?: boolean;
}> = [
  { key: Keys.authSession, description: "Auth JWT session (userId, tokens)" },
  { key: Keys.locale, description: "Preferred UI locale" },
  {
    key: Keys.swapSettings,
    description: "Swap slippage (bps) and deadline (minutes)",
  },
  {
    key: Keys.ercs20TokenCache,
    description: "Cached ERCS-20 token search/browse metadata",
  },
  { key: Keys.perpsLeverage, description: "Last selected perps leverage" },
  { key: Keys.spotChartView, description: "Spot trading chart interval view" },
  { key: Keys.perpsChartView, description: "Perps trading chart interval view" },
  {
    key: `${KeyPrefixes.spotOrderSalt}:{userId}`,
    description: "Spot order/withdraw EIP-712 salt sequence",
    scopedByUser: true,
  },
  {
    key: `${KeyPrefixes.perpsOrderSalt}:{userId}`,
    description: "Perps order/withdraw EIP-712 salt sequence",
    scopedByUser: true,
  },
  {
    key: `${KeyPrefixes.spotUserBalancesId}:{userId}`,
    description: "Spot ledger userBalancesId by tokenAddress",
    scopedByUser: true,
  },
  {
    key: `${KeyPrefixes.perpsUserBalancesId}:{userId}`,
    description: "Perps ledger userBalancesId by tokenAddress",
    scopedByUser: true,
  },
] as const;

function userKey(prefix: string, userId: string | null | undefined): string {
  return userId ? `${prefix}:${userId}` : `${prefix}:anonymous`;
}

function canUse(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getItem(key: string): string | null {
  if (!canUse()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function removeItem(key: string): void {
  if (!canUse()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function getJson<T>(key: string): T | null {
  const raw = getItem(key);
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJson(key: string, value: unknown): void {
  setItem(key, JSON.stringify(value));
}

// —— Auth session ——

export function loadAuthSessionStorage<T extends object>(): T | null {
  return getJson<T>(Keys.authSession);
}

export function saveAuthSessionStorage(session: object): void {
  setJson(Keys.authSession, session);
}

export function clearAuthSessionStorage(): void {
  removeItem(Keys.authSession);
}

// —— Locale ——

export function loadLocaleStorage(): string | null {
  return getItem(Keys.locale);
}

export function saveLocaleStorage(locale: string): void {
  setItem(Keys.locale, locale);
}

// —— Swap settings ——

export function loadSwapSettingsStorage<T extends object>(): T | null {
  return getJson<T>(Keys.swapSettings);
}

export function saveSwapSettingsStorage(settings: object): void {
  setJson(Keys.swapSettings, settings);
}

// —— ERCS-20 token cache ——

export function loadErcs20TokenCacheStorage(): unknown {
  return getJson<unknown>(Keys.ercs20TokenCache);
}

export function saveErcs20TokenCacheStorage(items: unknown): void {
  setJson(Keys.ercs20TokenCache, items);
}

// —— Perps leverage ——

export function loadPerpsLeverageStorage(): string | null {
  return getItem(Keys.perpsLeverage);
}

export function savePerpsLeverageStorage(leverage: string): void {
  setItem(Keys.perpsLeverage, leverage);
}

// —— Chart view ——

export function loadChartViewStorage(product: "spot" | "perps"): string | null {
  return getItem(product === "spot" ? Keys.spotChartView : Keys.perpsChartView);
}

export function saveChartViewStorage(
  product: "spot" | "perps",
  view: string
): void {
  setItem(product === "spot" ? Keys.spotChartView : Keys.perpsChartView, view);
}

// —— Order salt ——

export function loadSpotOrderSaltStorage(userId: string | null | undefined): string | null {
  return getItem(userKey(KeyPrefixes.spotOrderSalt, userId));
}

export function saveSpotOrderSaltStorage(
  userId: string | null | undefined,
  salt: string
): void {
  setItem(userKey(KeyPrefixes.spotOrderSalt, userId), salt);
}

export function loadPerpsOrderSaltStorage(userId: string | null | undefined): string | null {
  return getItem(userKey(KeyPrefixes.perpsOrderSalt, userId));
}

export function savePerpsOrderSaltStorage(
  userId: string | null | undefined,
  salt: string
): void {
  setItem(userKey(KeyPrefixes.perpsOrderSalt, userId), salt);
}

// —— Spot userBalancesId map ——

function parseUserBalancesIdMap(parsed: unknown): Record<string, number> {
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [token, id] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof id === "number" && Number.isFinite(id) && id > 0) {
      out[token.toLowerCase()] = id;
    }
  }
  return out;
}

export function loadSpotUserBalancesIdStorage(
  userId: string | null | undefined
): Record<string, number> {
  return parseUserBalancesIdMap(getJson<unknown>(userKey(KeyPrefixes.spotUserBalancesId, userId)));
}

export function saveSpotUserBalancesIdStorage(
  userId: string | null | undefined,
  map: Record<string, number>
): void {
  setJson(userKey(KeyPrefixes.spotUserBalancesId, userId), map);
}

// —— Perps userBalancesId map ——

export function loadPerpsUserBalancesIdStorage(
  userId: string | null | undefined
): Record<string, number> {
  return parseUserBalancesIdMap(getJson<unknown>(userKey(KeyPrefixes.perpsUserBalancesId, userId)));
}

export function savePerpsUserBalancesIdStorage(
  userId: string | null | undefined,
  map: Record<string, number>
): void {
  setJson(userKey(KeyPrefixes.perpsUserBalancesId, userId), map);
}
