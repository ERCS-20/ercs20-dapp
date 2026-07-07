export type AuthLoginReq = {
  walletAddress: string;
  timestamp: number;
  signature: string;
  clientType: string;
};

export type AuthRefreshReq = {
  refreshToken: string;
};

export type AuthTokenRsp = {
  userId: string;
  sessionId: number;
  tokenVersion: number;
  jwtToken: string;
  jwtRefreshToken: string;
};

/** POST /auth/logout — single-device sign-out (revoke current session). */
export type AuthVersionRsp = {
  userId: string;
  sessionId: number;
  tokenVersion: number;
};
