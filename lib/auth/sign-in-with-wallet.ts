import type { SignTypedDataMutateAsync } from "wagmi/query";

import { buildAuthLoginRequest, getLoginSignTypedData } from "@/lib/auth/login-eip712";
import { setAuthSession, type AuthSession } from "@/lib/auth/session";
import { loginAuth } from "@/services/auth/api";

/** EIP-712 wallet sign-in → POST /auth/login → persist session. */
export async function signInWithWallet(
  address: `0x${string}`,
  signTypedDataAsync: SignTypedDataMutateAsync<unknown>
): Promise<AuthSession> {
  const timestamp = Math.floor(Date.now() / 1000);
  const typedData = getLoginSignTypedData(address, timestamp);
  const signature = await signTypedDataAsync(typedData);
  const data = await loginAuth(buildAuthLoginRequest(address, signature, timestamp));

  const session: AuthSession = {
    userId: data.userId,
    sessionId: data.sessionId,
    tokenVersion: data.tokenVersion,
    jwtToken: data.jwtToken,
    jwtRefreshToken: data.jwtRefreshToken,
  };
  setAuthSession(session);
  return session;
}
