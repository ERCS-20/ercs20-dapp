"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { ProfileTransferAddressBlock } from "@/components/profile/shared/profile-transfer-dialog-parts";
import { profileDetailSectionClass } from "@/components/profile/shell/profile-shell";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/use-wallet";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import { getPerpsWithdrawSignTypedData } from "@/lib/orders/perps-withdraw-eip712";
import { createNativeUsdcToken } from "@/lib/profile/native-usdc-token";
import { ProfileRoutes } from "@/lib/profile/routes";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { formatBalance } from "@/lib/utils/format/balance";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  useApplyPerpsWithdraw,
  usePerpsOrderSalt,
  usePerpsOrdersUserBalance,
} from "@/services/perps/orders/hooks";

const NATIVE_USDC = createNativeUsdcToken();

function trimDecimalInput(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}

export function ProfilePerpsWithdrawView() {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { address, isConnected, chainId } = useWallet();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const { mutateAsync: fetchOrderSalt, isPending: isSaltPending } = usePerpsOrderSalt();
  const { mutateAsync: submitWithdraw, isPending: isSubmitPending } = useApplyPerpsWithdraw();

  const [amount, setAmount] = useState("");
  const [sizePct, setSizePct] = useState(0);

  const ledgerTokenAddress = getPerpsNativeTokenAddress();
  const tokenDecimals = NATIVE_USDC.decimals;

  const {
    data: ordersBalance,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
    refetch: refetchOrdersBalance,
  } = usePerpsOrdersUserBalance({ enabled: isAuthenticated });

  useEffect(() => {
    if (isAuthenticated) {
      void refetchOrdersBalance();
    }
  }, [isAuthenticated, refetchOrdersBalance]);

  const balancePending = isBalanceLoading || (isBalanceFetching && !ordersBalance);
  const userBalanceId = ordersBalance?.userBalanceId ?? undefined;

  const availableWei = useMemo(() => {
    if (!ordersBalance) return undefined;
    try {
      const v = BigInt(ordersBalance.balance);
      return v > BigInt(0) ? v : undefined;
    } catch {
      return undefined;
    }
  }, [ordersBalance]);

  const canUseSizePct = isAuthenticated && isConnected && availableWei != null;

  const applyWithdrawPercent = useCallback(
    (pct: number) => {
      if (pct < 1 || pct > 100 || availableWei == null) return;
      const part = (availableWei * BigInt(pct)) / BigInt(100);
      setAmount(trimDecimalInput(formatUnits(part, tokenDecimals)));
    },
    [availableWei, tokenDecimals]
  );

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success(t("wallet.addressCopied"));
    } catch {
      toast.error(t("wallet.copyFailed"));
    }
  }, [address, t]);

  const busy = isSigning || isSaltPending || isSubmitPending;

  async function handleConfirm() {
    if (!address) return;

    if (!isAuthenticated) {
      toast.error(t("auth.loginTitle"));
      return;
    }
    if (chainId == null) {
      toast.error(t("profile.withdrawFailed"));
      return;
    }

    const trimmed = amount.trim();
    if (!trimmed) {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(trimmed, tokenDecimals);
    } catch {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    if (parsedAmount <= BigInt(0)) {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    if (!ordersBalance) {
      toast.error(t("profile.withdrawFailed"));
      return;
    }

    if (userBalanceId == null) {
      toast.error(t("profile.withdrawFailed"));
      return;
    }

    if (parsedAmount > BigInt(ordersBalance.balance)) {
      toast.error(t("profile.insufficientBalance"));
      return;
    }

    try {
      const { salt } = await fetchOrderSalt();

      const signature = await signTypedDataAsync(
        getPerpsWithdrawSignTypedData(
          {
            fromAddress: address,
            tokenAddress: ledgerTokenAddress,
            amount: parsedAmount,
            salt: BigInt(salt),
          },
          chainId
        )
      );

      await submitWithdraw({
        userBalanceId,
        fromAddress: address,
        tokenAddress: ledgerTokenAddress,
        amount: parsedAmount.toString(),
        salt,
        signature,
      });

      toast.success(
        t("profile.withdrawSubmitted").replace("{symbol}", NATIVE_USDC.symbol)
      );
      router.push(ProfileRoutes.perpsWithdrawals);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("profile.withdrawFailed")));
    }
  }

  const balanceLabel = useMemo(() => {
    if (balancePending) return "…";
    if (!ordersBalance) return isAuthenticated ? "—" : "—";
    return formatBalance(ordersBalance.balance, tokenDecimals);
  }, [balancePending, ordersBalance, isAuthenticated, tokenDecimals]);

  const canSubmit =
    isAuthenticated &&
    isConnected &&
    Boolean(address) &&
    Boolean(ordersBalance) &&
    userBalanceId != null &&
    !balancePending &&
    !busy;

  return (
    <section className={profileDetailSectionClass}>
      <ProfileBackLink
        href={ProfileRoutes.dashboard}
        label={t("profile.backToDashboard")}
        className="mb-4"
      />

      <div className="mx-auto w-full max-w-[480px]">
        <div className="rounded-[28px] bg-brand-alt/10 p-1 shadow-lg ring-1 ring-brand-alt/20">
          <div className="rounded-[24px] bg-card p-5 sm:p-6">
            <ProfileFormHeader
              tone="brand-alt"
              icon={<UploadIcon aria-hidden />}
              title={t("profile.withdraw")}
              description={t("profile.perpsWithdrawDialogDesc")}
            />

            <div className="space-y-4">
              <div className="bg-brand-alt/5 border-brand-alt/20 space-y-1.5 rounded-2xl border p-3.5 sm:p-4">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
                  <span>{t("profile.amount")}</span>
                  <span>
                    {t("profile.availableBalance")}: {balanceLabel} {NATIVE_USDC.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Input
                    id="perps-withdraw-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setSizePct(0);
                      let x = e.target.value.replace(/[^\d.]/g, "");
                      const dot = x.indexOf(".");
                      if (dot !== -1) {
                        x =
                          x.slice(0, dot + 1) +
                          x.slice(dot + 1).replace(/\./g, "");
                      }
                      setAmount(x);
                    }}
                    placeholder={isConnected ? t("profile.amountPlaceholder") : "—"}
                    className="text-foreground placeholder:text-muted-foreground h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-transparent sm:text-3xl"
                    aria-label={t("profile.amount")}
                    autoComplete="off"
                    disabled={busy}
                  />
                  <span className="bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 sm:py-2 sm:pr-3 sm:pl-2.5">
                    <Image
                      src={getTokenIconSrc(NATIVE_USDC.symbol)}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 shrink-0 rounded-full ring-1 ring-border/60"
                      unoptimized
                    />
                    <span>{NATIVE_USDC.symbol}</span>
                  </span>
                </div>
                <SizePctControls
                  pct={sizePct}
                  disabled={!canUseSizePct || busy}
                  side="sell"
                  onPctChange={(pct) => {
                    setSizePct(pct);
                    applyWithdrawPercent(pct);
                  }}
                />
              </div>

              {address ? (
                <ProfileTransferAddressBlock
                  id="perps-withdraw-address"
                  label={t("profile.toAddress")}
                  value={address}
                  onCopy={() => void copyAddress()}
                  copyLabel={t("profile.copyAddress")}
                  tone="brand-alt"
                />
              ) : (
                <p className="text-muted-foreground rounded-xl border border-dashed border-brand-alt/20 bg-brand-alt/5 px-3.5 py-3 text-sm">
                  {t("profile.notConnected")}
                </p>
              )}
            </div>

            <Button
              type="button"
              className={cn(
                "mt-4 h-11 w-full rounded-xl text-base",
                "bg-brand-alt text-brand-alt-on hover:bg-brand-alt/90"
              )}
              onClick={() => void handleConfirm()}
              disabled={!canSubmit}
            >
              {busy ? t("swap.confirmWallet") : t("profile.confirmWithdraw")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
