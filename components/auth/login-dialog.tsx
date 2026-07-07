"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import {
  CircleUserIcon,
  KeyRoundIcon,
  Loader2Icon,
  PenLineIcon,
  WalletIcon,
} from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAccount, useSignTypedData } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { buildAuthLoginRequest, getLoginSignTypedData } from "@/lib/auth/login-eip712";
import { setAuthSession } from "@/lib/auth/session";
import { shortTokenAddress } from "@/lib/utils/format/address";
import { cn } from "@/lib/utils";
import { loginAuth } from "@/services/auth/api";
import { useI18n } from "@/providers/i18n-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoggedIn?: () => void;
};

function StepItem({
  step,
  active,
  done,
  children,
}: {
  step: number;
  active: boolean;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-2.5">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          done && "bg-brand text-primary-foreground",
          active && !done && "bg-brand/15 text-brand ring-1 ring-brand/25",
          !active && !done && "bg-muted text-muted-foreground ring-1 ring-border/60"
        )}
      >
        {step}
      </span>
      <span
        className={cn(
          "text-xs leading-relaxed sm:text-sm",
          active || done ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
      </span>
    </li>
  );
}

export function LoginDialog({ open, onOpenChange, onLoggedIn }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const busy = isSigning || isSubmitting;
  const step1Done = isConnected && Boolean(address);
  const step2Active = step1Done;

  const handleConnect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const handleSignIn = useCallback(async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const typedData = getLoginSignTypedData(address, timestamp);
      const signature = await signTypedDataAsync(typedData);
      const data = await loginAuth(buildAuthLoginRequest(address, signature, timestamp));
      setAuthSession({
        userId: data.userId,
        sessionId: data.sessionId,
        tokenVersion: data.tokenVersion,
        jwtToken: data.jwtToken,
        jwtRefreshToken: data.jwtRefreshToken,
      });
      await queryClient.invalidateQueries({ queryKey: ["spot", "accounts"] });
      onLoggedIn?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("auth.loginFailed")));
    } finally {
      setIsSubmitting(false);
    }
  }, [address, onLoggedIn, onOpenChange, openConnectModal, queryClient, signTypedDataAsync, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] gap-0 rounded-2xl p-0 ring-1 ring-border/60 sm:max-w-md",
          "max-h-[min(90vh,640px)] overflow-y-auto"
        )}
      >
        <div className="border-border/60 bg-brand/5 border-b px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/20">
              <KeyRoundIcon aria-hidden className="size-5" />
            </div>
            <DialogHeader className="min-w-0 flex-1 gap-1.5 text-left sm:place-items-start">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t("auth.loginTitle")}
              </DialogTitle>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("auth.loginDesc")}
              </p>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <ol className="space-y-2.5">
            <StepItem step={1} active={!step1Done} done={step1Done}>
              {t("auth.loginStep1")}
            </StepItem>
            <StepItem step={2} active={step2Active} done={false}>
              {t("auth.loginStep2")}
            </StepItem>
          </ol>

          {step1Done && address ? (
            <div className="bg-muted/50 border-border/60 flex items-center gap-3 rounded-2xl border p-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20">
                <CircleUserIcon aria-hidden className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium">
                  {t("auth.loginWalletLabel")}
                </p>
                <p
                  className="text-foreground mt-0.5 truncate font-mono text-sm font-semibold"
                  title={address}
                >
                  {shortTokenAddress(address)}
                </p>
              </div>
              <PenLineIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground/70"
              />
            </div>
          ) : (
            <div className="border-border/60 flex items-center gap-3 rounded-2xl border border-dashed bg-muted/30 px-3.5 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60">
                <WalletIcon aria-hidden className="size-5" />
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                {t("auth.loginConnectHint")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2.5 border-t border-border/60 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl sm:flex-1"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("auth.loginLater")}
          </Button>
          {!isConnected ? (
            <Button
              type="button"
              className="h-11 w-full rounded-xl sm:flex-1"
              onClick={handleConnect}
              disabled={busy}
            >
              <WalletIcon className="size-4" aria-hidden />
              {t("wallet.connect")}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 w-full rounded-xl sm:flex-1"
              onClick={() => void handleSignIn()}
              disabled={busy}
            >
              {busy ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <PenLineIcon className="size-4" aria-hidden />
              )}
              {busy ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
