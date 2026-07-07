import { refreshAuth } from "@/services/auth/api";
import { clearAuthSession, getRefreshToken, setAuthSession } from "@/lib/auth/session";
import { requestLoginDialog } from "@/lib/auth/coordinator";

let refreshPromise: Promise<boolean> | null = null;

/** Clear session and open login dialog — refresh token is unusable, user must sign in again. */
function requireReLogin(): false {
  clearAuthSession();
  requestLoginDialog();
  return false;
}

/** Refresh access token using cached jwtRefreshToken. Returns false if re-login is needed. */
export async function refreshAuthSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return requireReLogin();
    }

    try {
      const data = await refreshAuth({ refreshToken });
      if (!data?.jwtToken || !data?.jwtRefreshToken) {
        return requireReLogin();
      }
      setAuthSession({
        userId: data.userId,
        sessionId: data.sessionId,
        tokenVersion: data.tokenVersion,
        jwtToken: data.jwtToken,
        jwtRefreshToken: data.jwtRefreshToken,
      });
      return true;
    } catch {
      // Any refresh API failure (4xx/5xx, business error, network) → must re-login
      return requireReLogin();
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
