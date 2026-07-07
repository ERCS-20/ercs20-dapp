type VoidFn = () => void;

const loginRequiredListeners = new Set<VoidFn>();

/** Subscribe to login-required events (from HTTP 401 AUTH_UNAUTHENTICATED). */
export function subscribeLoginRequired(listener: VoidFn): () => void {
  loginRequiredListeners.add(listener);
  return () => loginRequiredListeners.delete(listener);
}

export function requestLoginDialog(): void {
  for (const listener of loginRequiredListeners) {
    listener();
  }
}
