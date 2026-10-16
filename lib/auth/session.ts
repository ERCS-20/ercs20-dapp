import {
  clearAuthSessionStorage,
  loadAuthSessionStorage,
  saveAuthSessionStorage,
} from "@/lib/storage/local-storage";

export type AuthSession = {
  userId: string;
  sessionId: number;
  tokenVersion: number;
  jwtToken: string;
  jwtRefreshToken: string;
};

export function getAuthSession(): AuthSession | null {
  const parsed = loadAuthSessionStorage<AuthSession>();
  if (!parsed?.jwtToken || !parsed?.jwtRefreshToken) return null;
  return parsed;
}

export function setAuthSession(session: AuthSession): void {
  saveAuthSessionStorage(session);
}

export function clearAuthSession(): void {
  clearAuthSessionStorage();
}

export function getAccessToken(): string | null {
  const token = getAuthSession()?.jwtToken?.trim();
  return token || null;
}

export function getRefreshToken(): string | null {
  return getAuthSession()?.jwtRefreshToken ?? null;
}

export function isAuthenticated(): boolean {
  return getAccessToken() != null;
}
