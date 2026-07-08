"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import {
  useBalance,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { profileDetailSectionClass } from "@/components/profile/shell/profile-shell";
import { ProfileRoutes } from "@/lib/profile/routes";
import { ProfileDepositApproveDialog } from "@/components/profile/shared/profile-deposit-approve-dialog";
import { ProfileTransferAddressBlock } from "@/components/profile/shared/profile-transfer-dialog-parts";
import { ProfileTokenSelectSheet } from "@/components/profile/shared/profile-token-select-sheet";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import {
  getAssetVaultAddress,
  isAssetVaultConfigured,
} from "@/lib/config/asset-vault";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import {
  approveTokenForVault,
  executeGlobalSpotVaultDeposit,
  isNativeUsdcDepositAddress,
  readVaultErc20Allowance,
} from "@/lib/contracts/global-spot-vault";
import { resolveInitialProfileToken } from "@/lib/profile/resolve-initial-token";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { formatBalance } from "@/lib/utils/format/balance";
import { useErcs20Pagination } from "@/services/chain/hooks";
import type { Ercs20Rsp } from "@/services/chain/types";
import { useUserBalance } from "@/services/spot/accounts/hooks";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const DISCONNECTED = "--";

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

function TokenIcon({ symbol }: { symbol: string }) {
  const label = symbol.trim() || "TOKEN";
  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-border/60 transition-transform duration-300 ease-out group-hover:scale-105"
      unoptimized
    />
  );
}

export function ProfileDepositView() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const targetChainId = getSwapTargetChainId();
  const vaultAddress = getAssetVaultAddress();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;

  const { data: tokenPage } = useErcs20Pagination({ currentPage: 1, pageSize: 20 });
  const [amount, setAmount] = useState("");
  const [sizePct, setSizePct] = useState(0);
  const [selectedToken, setSelectedToken] = useState<Ercs20Rsp | null>(null);
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();
  const handledDepositHashRef = useRef<`0x${string}` | null>(null);

  useEffect(() => {
    if (selectedToken) return;
    const initial = resolveInitialProfileToken(
      tokenPage?.pageItems ?? [],
      searchParams.get("token")
    );
    if (initial) setSelectedToken(initial);
  }, [tokenPage?.pageItems, searchParams, selectedToken]);

  const token = selectedToken?.contract as `0x${string}` | undefined;
  const isNative =
    selectedToken != null && isNativeUsdcDepositAddress(selectedToken.contract);
  const tokenDecimals = selectedToken?.decimals ?? 18;

  const spotBalanceTokenAddress = useMemo(
    () => resolveSpotBalanceTokenAddress(selectedToken?.contract),
    [selectedToken?.contract]
  );

  const {
    data: spotBalance,
    isLoading: isSpotBalanceLoading,
    isFetching: isSpotBalanceFetching,
    refetch: refetchSpotBalance,
  } = useUserBalance(spotBalanceTokenAddress);

  useEffect(() => {
    if (isAuthenticated && spotBalanceTokenAddress) {
      void refetchSpotBalance();
    }
  }, [isAuthenticated, spotBalanceTokenAddress, refetchSpotBalance]);

  const spotBalancePending =
    isSpotBalanceLoading || (isSpotBalanceFetching && !spotBalance);

  const spotAvailableLabel = useMemo(() => {
    if (!selectedToken) return DISCONNECTED;
    if (spotBalancePending) return "…";
    if (!spotBalance) return isAuthenticated ? "—" : DISCONNECTED;
    return formatBalance(spotBalance.availableBalance, tokenDecimals);
  }, [
    selectedToken,
    spotBalancePending,
    spotBalance,
    isAuthenticated,
    tokenDecimals,
  ]);

  const spotFrozenLabel = useMemo(() => {
    if (!selectedToken) return DISCONNECTED;
    if (spotBalancePending) return "…";
    if (!spotBalance) return isAuthenticated ? "—" : DISCONNECTED;
    return formatBalance(spotBalance.frozenBalance, tokenDecimals);
  }, [
    selectedToken,
    spotBalancePending,
    spotBalance,
    isAuthenticated,
    tokenDecimals,
  ]);

  const balanceQueryEnabled =
    !!address && isConnected && targetChainId != null && !!token;

  const { data: nativeBal } = useBalance({
    address,
    chainId: targetChainId ?? undefined,
    query: { enabled: balanceQueryEnabled && isNative },
  });

  const { data: tokenBalRaw, isError: tokenBalReadError } = useTokenBalance({
    token: isNative ? undefined : token,
    address,
    chainId: targetChainId ?? undefined,
    query: { enabled: balanceQueryEnabled && !isNative },
  });

  const balanceLabel = useMemo(() => {
    if (!isConnected || !token) return DISCONNECTED;
    if (isNative) {
      if (!nativeBal) return DISCONNECTED;
      return trimDecimalInput(formatUnits(nativeBal.value, nativeBal.decimals));
    }
    if (tokenBalReadError) return "—";
    if (typeof tokenBalRaw === "bigint") {
      return trimDecimalInput(formatUnits(tokenBalRaw, tokenDecimals));
    }
    return DISCONNECTED;
  }, [isConnected, token, isNative, nativeBal, tokenBalReadError, tokenBalRaw, tokenDecimals]);

  const balanceWei = useMemo(() => {
    if (!isConnected || !token) return undefined;
    if (isNative) return nativeBal?.value;
    if (typeof tokenBalRaw === "bigint") return tokenBalRaw;
    return undefined;
  }, [isConnected, token, isNative, nativeBal, tokenBalRaw]);

  const balanceDecimals = isNative
    ? (nativeBal?.decimals ?? tokenDecimals)
    : tokenDecimals;

  const canUseSizePct =
    isConnected &&
    !wrongNetwork &&
    balanceWei != null &&
    balanceWei > BigInt(0);

  const applyDepositPercent = useCallback(
    (pct: number) => {
      if (pct < 1 || pct > 100 || balanceWei == null) return;
      const part = (balanceWei * BigInt(pct)) / BigInt(100);
      setAmount(trimDecimalInput(formatUnits(part, balanceDecimals)));
    },
    [balanceWei, balanceDecimals]
  );

  const parsedAmount = useMemo(
    () => (selectedToken ? parseDepositAmount(amount, tokenDecimals) : undefined),
    [amount, selectedToken, tokenDecimals]
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

  const busy = isApproving || isWritePending || isConfirming;

  useEffect(() => {
    if (!writeError) return;
    toast.error(t("profile.depositFailed"), {
      description: writeError.message.slice(0, 200),
    });
  }, [writeError, t]);

  useEffect(() => {
    if (!isSuccess || !selectedToken || !depositHash) return;
    if (handledDepositHashRef.current === depositHash) return;
    handledDepositHashRef.current = depositHash;
    toast.success(t("profile.depositSubmitted").replace("{symbol}", selectedToken.symbol));
    setAmount("");
    setSizePct(0);
    setDepositHash(undefined);
    resetWrite();
    void refetchSpotBalance();
  }, [isSuccess, selectedToken, depositHash, t, resetWrite, refetchSpotBalance]);

  const runDeposit = useCallback(async () => {
    if (
      !selectedToken ||
      parsedAmount == null ||
      !vaultAddress ||
      targetChainId == null ||
      !token
    ) {
      return;
    }

    const hash = await executeGlobalSpotVaultDeposit({
      writeContractAsync,
      vaultAddress,
      tokenAddress: token,
      amount: parsedAmount,
      chainId: targetChainId,
    });
    setDepositHash(hash);
  }, [
    selectedToken,
    parsedAmount,
    vaultAddress,
    targetChainId,
    token,
    writeContractAsync,
  ]);

  const handleApproveAndDeposit = useCallback(async () => {
    if (
      !selectedToken ||
      parsedAmount == null ||
      !address ||
      !vaultAddress ||
      targetChainId == null ||
      !publicClient ||
      !token
    ) {
      return;
    }

    setApproveDialogOpen(false);
    setIsApproving(true);
    resetWrite();
    try {
      await approveTokenForVault({
        publicClient,
        writeContractAsync,
        tokenAddress: token,
        vaultAddress,
        amount: parsedAmount,
        chainId: targetChainId,
      });
      await runDeposit();
    } catch {
      // writeContractAsync errors also surface via writeError effect
    } finally {
      setIsApproving(false);
    }
  }, [
    selectedToken,
    parsedAmount,
    address,
    vaultAddress,
    targetChainId,
    publicClient,
    token,
    writeContractAsync,
    runDeposit,
    resetWrite,
  ]);

  async function handleConfirm() {
    if (!isConnected || !address) {
      toast.error(t("profile.notConnected"));
      return;
    }
    if (wrongNetwork) {
      toast.error(t("swap.wrongNetwork"));
      return;
    }
    if (!isAssetVaultConfigured()) {
      toast.error(t("profile.depositVaultNotConfigured"));
      return;
    }
    if (!selectedToken || parsedAmount == null || !vaultAddress || !publicClient || !token) {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    resetWrite();
    setDepositHash(undefined);

    try {
      if (isNative) {
        await runDeposit();
        return;
      }

      const allowance = await readVaultErc20Allowance({
        publicClient,
        tokenAddress: token,
        owner: address,
        vaultAddress,
      });

      if (allowance >= parsedAmount) {
        await runDeposit();
        return;
      }

      setApproveDialogOpen(true);
    } catch {
      // writeContractAsync errors also surface via writeError effect
    }
  }

  function selectToken(token: Ercs20Rsp) {
    setSelectedToken(token);
    setAmount("");
    setSizePct(0);
    setApproveDialogOpen(false);
    setDepositHash(undefined);
    resetWrite();
  }

  const canSubmit =
    isConnected &&
    !wrongNetwork &&
    isAssetVaultConfigured() &&
    selectedToken != null &&
    parsedAmount != null &&
    !busy &&
    !approveDialogOpen;

  const displaySymbol = selectedToken?.symbol ?? "—";
  const approveAmountLabel = amount.trim() || "0";

  return (
    <>
      <ProfileTokenSelectSheet
        open={tokenSheetOpen}
        onOpenChange={setTokenSheetOpen}
        onSelect={selectToken}
      />

      <ProfileDepositApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        symbol={displaySymbol}
        amountLabel={approveAmountLabel}
        isApproving={isApproving}
        onApprove={handleApproveAndDeposit}
      />

      <section className={profileDetailSectionClass}>
        <ProfileBackLink href={ProfileRoutes.dashboard} label={t("profile.backToDashboard")} className="mb-4" />

        <div className="mx-auto w-full max-w-[480px]">
          <div className="rounded-[28px] bg-muted/50 p-1 shadow-lg ring-1 ring-border/60">
            <div className="rounded-[24px] bg-card p-5 sm:p-6">
              <ProfileFormHeader
                tone="brand"
                icon={<DownloadIcon aria-hidden />}
                title={t("profile.deposit")}
                description={t("profile.depositDialogDesc")}
              />

              <div className="bg-muted/50 border-border/60 mb-4 space-y-3 rounded-2xl border p-3.5 sm:p-4">
                <p className="text-muted-foreground text-center text-xs font-medium sm:text-sm">
                  {t("profile.spotAccounts")}
                </p>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                      {t("profile.availableBalance")}
                    </dt>
                    <dd className="text-brand min-w-0 truncate text-right tabular-nums text-sm font-semibold sm:text-base">
                      {spotAvailableLabel}
                      {selectedToken && spotAvailableLabel !== DISCONNECTED
                        ? ` ${selectedToken.symbol}`
                        : ""}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                      {t("profile.frozenBalance")}
                    </dt>
                    <dd className="text-brand-alt min-w-0 truncate text-right tabular-nums text-sm font-semibold sm:text-base">
                      {spotFrozenLabel}
                      {selectedToken && spotFrozenLabel !== DISCONNECTED
                        ? ` ${selectedToken.symbol}`
                        : ""}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-muted/50 border-border/60 space-y-1.5 rounded-2xl border p-3.5 sm:p-4">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
                  <span>{t("profile.amount")}</span>
                  <span>
                    {t("swap.balance")}: {balanceLabel}
                    {selectedToken && balanceLabel !== DISCONNECTED
                      ? ` ${selectedToken.symbol}`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Input
                    id="deposit-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setSizePct(0);
                      let x = e.target.value.replace(/[^\d.]/g, "");
                      const dot = x.indexOf(".");
                      if (dot !== -1) {
                        x = x.slice(0, dot + 1) + x.slice(dot + 1).replace(/\./g, "");
                      }
                      setAmount(x);
                    }}
                    placeholder={isConnected ? t("profile.amountPlaceholder") : DISCONNECTED}
                    className="text-foreground placeholder:text-muted-foreground h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-transparent sm:text-3xl"
                    aria-label={t("profile.amount")}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="group bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 transition hover:bg-muted/80 sm:py-2 sm:pr-3 sm:pl-2.5"
                    aria-label={`${t("profile.selectToken")}: ${displaySymbol}`}
                    onClick={() => setTokenSheetOpen(true)}
                  >
                    {selectedToken ? <TokenIcon symbol={selectedToken.symbol} /> : null}
                    <span className="max-w-[6.5rem] truncate sm:max-w-[7rem]">{displaySymbol}</span>
                  </button>
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
                    id="deposit-owner-address"
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
                  ? isApproving
                    ? t("profile.depositApproving")
                    : isWritePending
                      ? t("swap.confirmWallet")
                      : t("swap.confirming")
                  : t("profile.confirmDeposit")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
