"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LoginDialog } from "@/components/auth/login-dialog";
import { subscribeLoginRequired } from "@/lib/auth/coordinator";
import {
  clearAuthSession,
  getAuthSession,
  type AuthSession,
} from "@/lib/auth/session";
import { logoutAuth } from "@/services/auth/api";

type AuthContextValue = {
  session: AuthSession | null;
  /** False until client reads persisted session (SSR/hydration safe). */
  authReady: boolean;
  isAuthenticated: boolean;
  openLoginDialog: () => void;
  closeLoginDialog: () => void;
  refreshSession: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshSession = useCallback(() => {
    setSession(getAuthSession());
  }, []);

  useEffect(() => {
    setSession(getAuthSession());
    setAuthReady(true);
  }, []);

  useEffect(() => {
    return subscribeLoginRequired(() => setLoginOpen(true));
  }, []);

  const openLoginDialog = useCallback(() => setLoginOpen(true), []);
  const closeLoginDialog = useCallback(() => setLoginOpen(false), []);

  const signOut = useCallback(async () => {
    if (getAuthSession()) {
      try {
        await logoutAuth();
      } catch {
        // Revoke on server best-effort; always clear local session.
      }
    }
    clearAuthSession();
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      authReady,
      isAuthenticated: session != null,
      openLoginDialog,
      closeLoginDialog,
      refreshSession,
      signOut,
    }),
    [session, authReady, openLoginDialog, closeLoginDialog, refreshSession, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLoggedIn={refreshSession}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
