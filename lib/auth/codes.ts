/** Gateway JWT filter — no / missing Bearer token. */
export const AUTH_UNAUTHENTICATED = "AUTH_UNAUTHENTICATED";

/** Gateway JWT filter — access token expired; refresh with jwtRefreshToken. */
export const AUTH_ACCESS_TOKEN_EXPIRED = "AUTH_ACCESS_TOKEN_EXPIRED";

export const AUTH_CLIENT_TYPE = "web" as const;
