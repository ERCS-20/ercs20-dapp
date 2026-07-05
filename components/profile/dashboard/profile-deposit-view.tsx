"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
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
import { ProfileShell, profileDetailSectionClass, type ProfileSection } from "@/components/profile/shell/profile-shell";
import { ProfileTokenSelectSheet } from "@/components/profile/shared/profile-token-select-sheet";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import {
  getAssetVaultAddress,
  isAssetVaultConfigured,
  isNativeVaultToken,
} from "@/lib/config/asset-vault";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import { assetVaultAbi } from "@/lib/contracts/asset-vault-abi";
import { erc20WriteAbi } from "@/lib/contracts/erc20";
import { isNativeUsdcToken } from "@/lib/profile/native-usdc-token";
import { resolveInitialProfileToken } from "@/lib/profile/resolve-initial-token";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { useErcs20Pagination } from "@/services/chain/hooks";
import type { Ercs20Rsp } from "@/services/chain/types";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
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
    selectedToken != null &&
    (isNativeVaultToken(selectedToken.contract) || isNativeUsdcToken(selectedToken));
  const tokenDecimals = selectedToken?.decimals ?? 18;
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
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
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
    if (!isSuccess || !selectedToken) return;
    toast.success(t("profile.depositSubmitted").replace("{symbol}", selectedToken.symbol));
    router.push("/profile");
  }, [isSuccess, selectedToken, router, t]);

  const submitDeposit = useCallback(async () => {
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

    const isNativeToken = isNativeVaultToken(token);

    if (!isNativeToken) {
      const allowance = await publicClient.readContract({
        address: token,
        abi: erc20WriteAbi,
        functionName: "allowance",
        args: [address, vaultAddress],
      });

      if (allowance < parsedAmount) {
        const approveHash = await writeContractAsync({
          address: token,
          abi: erc20WriteAbi,
          functionName: "approve",
          args: [vaultAddress, parsedAmount],
          chainId: targetChainId,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
    }

    await writeContractAsync({
      address: vaultAddress,
      abi: assetVaultAbi,
      functionName: "deposit",
      args: [isNativeToken ? zeroAddress : token, parsedAmount],
      value: isNativeToken ? parsedAmount : undefined,
      chainId: targetChainId,
    });
  }, [
    selectedToken,
    parsedAmount,
    address,
    vaultAddress,
    targetChainId,
    publicClient,
    token,
    writeContractAsync,
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
    if (!selectedToken || parsedAmount == null) {
      toast.error(t("profile.invalidAmount"));
      return;
    }

    try {
      await submitDeposit();
    } catch {
      // writeContractAsync errors also surface via writeError effect
    }
  }

  function handleSectionChange(section: ProfileSection) {
    if (section === "dashboard") {
      router.push("/profile");
      return;
    }
    router.push(`/profile?section=${section}`);
  }

  function selectToken(token: Ercs20Rsp) {
    setSelectedToken(token);
    setAmount("");
    setSizePct(0);
    resetWrite();
  }

  const canSubmit =
    isConnected &&
    !wrongNetwork &&
    isAssetVaultConfigured() &&
    selectedToken != null &&
    parsedAmount != null &&
    !busy;

  const displaySymbol = selectedToken?.symbol ?? "—";

  return (
    <ProfileShell section="dashboard" onSectionChange={handleSectionChange}>
      <ProfileTokenSelectSheet
        open={tokenSheetOpen}
        onOpenChange={setTokenSheetOpen}
        onSelect={selectToken}
      />

      <section className={profileDetailSectionClass}>
        <ProfileBackLink href="/profile" label={t("profile.backToDashboard")} className="mb-4" />

        <div className="mx-auto w-full max-w-[480px]">
          <div className="rounded-[28px] bg-muted/50 p-1 shadow-lg ring-1 ring-border/60">
            <div className="rounded-[24px] bg-card p-5 sm:p-6">
              <ProfileFormHeader
                tone="brand"
                icon={<DownloadIcon aria-hidden />}
                title={t("profile.deposit")}
                description={t("profile.depositDialogDesc")}
              />

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
    </ProfileShell>
  );
}
