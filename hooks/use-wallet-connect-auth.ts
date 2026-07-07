"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSignTypedData } from "wagmi";

import { getApiErrorMessage } from "@/lib/api/errors";
import { signInWithWallet } from "@/lib/auth/sign-in-with-wallet";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type Options = {
  /** Called after wagmi disconnect succeeds (e.g. redirect). */
  onDisconnected?: () => void;
};

/** Connect wallet → sign in; disconnect → sign out then disconnect wallet. */
export function useWalletConnectAuth(options: Options = {}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { isAuthenticated, openLoginDialog, refreshSession, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const { disconnect, isPending: isDisconnecting } = useDisconnect({
    mutation: {
      onSuccess: options.onDisconnected,
    },
  });

  const pendingConnectLoginRef = useRef(false);
  const signingInRef = useRef(false);

  const runSignIn = useCallback(async () => {
    if (!address || signingInRef.current) return false;
    signingInRef.current = true;
    try {
      await signInWithWallet(address, signTypedDataAsync);
      await queryClient.invalidateQueries({ queryKey: ["spot", "accounts"] });
      refreshSession();
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("auth.loginFailed")));
      openLoginDialog();
      return false;
    } finally {
      signingInRef.current = false;
    }
  }, [
    address,
    openLoginDialog,
    queryClient,
    refreshSession,
    signTypedDataAsync,
    t,
  ]);

  useEffect(() => {
    if (!pendingConnectLoginRef.current) return;
    if (!isConnected || !address || isAuthenticated) return;

    pendingConnectLoginRef.current = false;
    void runSignIn();
  }, [isConnected, address, isAuthenticated, runSignIn]);

  const connectWallet = useCallback(() => {
    if (isConnected && address) {
      if (!isAuthenticated) void runSignIn();
      return;
    }
    pendingConnectLoginRef.current = true;
    openConnectModal?.();
  }, [address, isAuthenticated, isConnected, openConnectModal, runSignIn]);

  const disconnectWallet = useCallback(async () => {
    await signOut();
    disconnect();
  }, [disconnect, signOut]);

  return {
    connectWallet,
    disconnectWallet,
    isDisconnecting,
    isAuthenticated,
    isConnected,
  };
}
