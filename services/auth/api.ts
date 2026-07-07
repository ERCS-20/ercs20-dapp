import { request } from "@/lib/api/request";
import { AuthApi } from "@/services/auth/paths";
import type {
  AuthLoginReq,
  AuthRefreshReq,
  AuthTokenRsp,
  AuthVersionRsp,
} from "@/services/auth/types";

/** POST /auth/login — wallet EIP-712 signature. */
export function loginAuth(req: AuthLoginReq) {
  return request.post<AuthTokenRsp>(AuthApi.login, req);
}

/** POST /auth/refresh — rotate access + refresh tokens. */
export function refreshAuth(req: AuthRefreshReq) {
  return request.post<AuthTokenRsp>(AuthApi.refresh, req);
}

/** POST /auth/logout — revoke current session (`X-User-Id` / `X-Session-Id` injected by gateway). */
export function logoutAuth() {
  return request.post<AuthVersionRsp>(AuthApi.logout);
}
