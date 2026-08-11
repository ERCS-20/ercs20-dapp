"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import {
  useBalance,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { ProfileTransferAddressBlock } from "@/components/profile/shared/profile-transfer-dialog-parts";
import { profileDetailSectionClass } from "@/components/profile/shell/profile-shell";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/use-wallet";
import {
  getPerpsAssetVaultAddress,
  isPerpsAssetVaultConfigured,
} from "@/lib/config/perps-asset-vault";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import { executeGlobalPerpsVaultDeposit } from "@/lib/contracts/global-perps-vault";
import { createNativeUsdcToken } from "@/lib/profile/native-usdc-token";
import { ProfileRoutes } from "@/lib/profile/routes";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { formatBalance } from "@/lib/utils/format/balance";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { usePerpsUserBalance } from "@/services/perps/accounts/hooks";

const DISCONNECTED = "--";
const NATIVE_USDC = createNativeUsdcToken();

function trimDecimalInput(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}

function parseDepositAmount(raw: string, decimals: number): bigint | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const v = parseUnits(trimmed, decimals);
    return v > BigInt(0) ? v : undefined;
  } catch {
    return undefined;
  }
}

export function ProfilePerpsDepositView() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const targetChainId = getSwapTargetChainId();
  const vaultAddress = getPerpsAssetVaultAddress();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;

  const [amount, setAmount] = useState("");
  const [sizePct, setSizePct] = useState(0);
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();
  const handledDepositHashRef = useRef<`0x${string}` | null>(null);

  const tokenDecimals = NATIVE_USDC.decimals;

  const {
    data: perpsBalance,
    isLoading: isPerpsBalanceLoading,
    isFetching: isPerpsBalanceFetching,
    refetch: refetchPerpsBalance,
  } = usePerpsUserBalance({ enabled: isAuthenticated });

  useEffect(() => {
    if (isAuthenticated) {
      void refetchPerpsBalance();
    }
  }, [isAuthenticated, refetchPerpsBalance]);

  const perpsBalancePending =
    isPerpsBalanceLoading || (isPerpsBalanceFetching && !perpsBalance);

  const availableLabel = useMemo(() => {
    if (perpsBalancePending) return "…";
    if (!perpsBalance) return isAuthenticated ? "—" : DISCONNECTED;
    return formatBalance(perpsBalance.availableBalance, tokenDecimals);
  }, [perpsBalancePending, perpsBalance, isAuthenticated, tokenDecimals]);

  const frozenLabel = useMemo(() => {
    if (perpsBalancePending) return "…";
    if (!perpsBalance) return isAuthenticated ? "—" : DISCONNECTED;
    return formatBalance(perpsBalance.frozenBalance, tokenDecimals);
  }, [perpsBalancePending, perpsBalance, isAuthenticated, tokenDecimals]);

  const { data: nativeBal } = useBalance({
    address,
    chainId: targetChainId ?? undefined,
    query: {
      enabled: !!address && isConnected && targetChainId != null,
    },
  });

  const balanceLabel = useMemo(() => {
    if (!isConnected) return DISCONNECTED;
    if (!nativeBal) return DISCONNECTED;
    return trimDecimalInput(formatUnits(nativeBal.value, nativeBal.decimals));
  }, [isConnected, nativeBal]);

  const balanceWei = nativeBal?.value;
  const balanceDecimals = nativeBal?.decimals ?? tokenDecimals;

  const canUseSizePct =
    isConnected && !wrongNetwork && balanceWei != null && balanceWei > BigInt(0);

  const applyDepositPercent = useCallback(
    (pct: number) => {
      if (pct < 1 || pct > 100 || balanceWei == null) return;
      const part = (balanceWei * BigInt(pct)) / BigInt(100);
      setAmount(trimDecimalInput(formatUnits(part, balanceDecimals)));
    },
    [balanceWei, balanceDecimals]
  );

  const parsedAmount = useMemo(
    () => parseDepositAmount(amount, tokenDecimals),
    [amount, tokenDecimals]
  );

  const {
    writeContractAsync,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
    chainId: targetChainId ?? undefined,
  });

  const busy = isWritePending || isConfirming;

  useEffect(() => {
    if (!writeError) return;
    toast.error(t("profile.depositFailed"), {
      description: writeError.message.slice(0, 200),
    });
  }, [writeError, t]);

  useEffect(() => {
    if (!isSuccess || !depositHash) return;
    if (handledDepositHashRef.current === depositHash) return;
    handledDepositHashRef.current = depositHash;
    toast.success(
      t("profile.depositSubmitted").replace("{symbol}", NATIVE_USDC.symbol)
    );
    setAmount("");
    setSizePct(0);
    setDepositHash(undefined);
    resetWrite();
    void refetchPerpsBalance();
  }, [isSuccess, depositHash, t, resetWrite, refetchPerpsBalance]);

  const runDeposit = useCallback(async () => {
    if (parsedAmount == null || !vaultAddress || targetChainId == null) return;

    const hash = await executeGlobalPerpsVaultDeposit({
      writeContractAsync,
      vaultAddress,
      amount: parsedAmount,
      chainId: targetChainId,
    });
    setDepositHash(hash);
  }, [parsedAmount, vaultAddress, targetChainId, writeContractAsync]);

  async function handleConfirm() {
    if (!isConnected || !address) {
      toast.error(t("profile.notConnected"));
      return;
    }
    if (wrongNetwork) {
      toast.error(t("swap.wrongNetwork"));
      return;
    }
    if (!isPerpsAssetVaultConfigured()) {
      toast.error(t("profile.perpsDepositVaultNotConfigured"));
      return;
    }
    if (parsedAmount == null || !vaultAddress) {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    resetWrite();
    setDepositHash(undefined);

    try {
      await runDeposit();
    } catch {
      // writeContractAsync errors also surface via writeError effect
    }
  }

  const canSubmit =
    isConnected &&
    !wrongNetwork &&
    isPerpsAssetVaultConfigured() &&
    parsedAmount != null &&
    !busy;

  return (
    <section className={profileDetailSectionClass}>
      <ProfileBackLink
        href={ProfileRoutes.dashboard}
        label={t("profile.backToDashboard")}
        className="mb-4"
      />

      <div className="mx-auto w-full max-w-[480px]">
        <div className="rounded-[28px] bg-muted/50 p-1 shadow-lg ring-1 ring-border/60">
          <div className="rounded-[24px] bg-card p-5 sm:p-6">
            <ProfileFormHeader
              tone="brand"
              icon={<DownloadIcon aria-hidden />}
              title={t("profile.deposit")}
              description={t("profile.perpsDepositDialogDesc")}
            />

            <div className="bg-muted/50 border-border/60 mb-4 space-y-3 rounded-2xl border p-3.5 sm:p-4">
              <p className="text-muted-foreground text-center text-xs font-medium sm:text-sm">
                {t("profile.perpsAccounts")}
              </p>
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                    {t("profile.availableBalance")}
                  </dt>
                  <dd className="text-brand min-w-0 truncate text-right text-sm font-semibold tabular-nums sm:text-base">
                    {availableLabel}
                    {availableLabel !== DISCONNECTED ? ` ${NATIVE_USDC.symbol}` : ""}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                    {t("profile.frozenBalance")}
                  </dt>
                  <dd className="text-brand-alt min-w-0 truncate text-right text-sm font-semibold tabular-nums sm:text-base">
                    {frozenLabel}
                    {frozenLabel !== DISCONNECTED ? ` ${NATIVE_USDC.symbol}` : ""}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-muted/50 border-border/60 space-y-1.5 rounded-2xl border p-3.5 sm:p-4">
              <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
                <span>{t("profile.amount")}</span>
                <span>
                  {t("swap.balance")}: {balanceLabel}
                  {balanceLabel !== DISCONNECTED ? ` ${NATIVE_USDC.symbol}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Input
                  id="perps-deposit-amount"
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
                  placeholder={
                    isConnected ? t("profile.amountPlaceholder") : DISCONNECTED
                  }
                  className="text-foreground placeholder:text-muted-foreground h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-transparent sm:text-3xl"
                  aria-label={t("profile.amount")}
                  autoComplete="off"
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
                disabled={!canUseSizePct}
                side="buy"
                onPctChange={(pct) => {
                  setSizePct(pct);
                  applyDepositPercent(pct);
                }}
              />
            </div>

            <div className="mt-4">
              {address ? (
                <ProfileTransferAddressBlock
                  id="perps-deposit-owner-address"
                  label={t("profile.depositAssetOwner")}
                  value={address}
                  hint={t("profile.depositOwnerHint")}
                  tone="brand"
                />
              ) : (
                <p className="text-muted-foreground rounded-xl border border-dashed border-brand/20 bg-brand/5 px-3.5 py-3 text-sm">
                  {t("profile.notConnected")}
                </p>
              )}
            </div>

            <Button
              type="button"
              className={cn("mt-4 h-11 w-full rounded-xl text-base")}
              onClick={() => void handleConfirm()}
              disabled={!canSubmit}
            >
              {busy
                ? isWritePending
                  ? t("swap.confirmWallet")
                  : t("swap.confirming")
                : t("profile.confirmDeposit")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
