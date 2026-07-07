export type AuthSession = {
  userId: string;
  sessionId: number;
  tokenVersion: number;
  jwtToken: string;
  jwtRefreshToken: string;
};

const STORAGE_KEY = "orbix.exchange.auth.session";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAuthSession(): AuthSession | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.jwtToken || !parsed?.jwtRefreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    const token = parsed?.jwtToken?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  return getAuthSession()?.jwtRefreshToken ?? null;
}

export function isAuthenticated(): boolean {
  return getAccessToken() != null;
}
