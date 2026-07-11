"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListPlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { ProfileApplyListTokenSelectSheet } from "@/components/profile/apply-list/profile-apply-list-token-select-sheet";
import { profileDetailSectionClass } from "@/components/profile/shell/profile-shell";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import {
  getSpotPairFactoryAddress,
  isSpotPairFactoryConfigured,
} from "@/lib/config/spot-pair-factory";
import { getWusdcAddress } from "@/lib/config/wusdc";
import { ercs20TokenAbi } from "@/lib/contracts/abis";
import {
  executeSpotPairFactoryCreate,
  readSpotPairExists,
} from "@/lib/contracts/spot-pair-factory";
import { isNativeUsdcDepositAddress } from "@/lib/contracts/global-spot-vault";
import { ProfileRoutes } from "@/lib/profile/routes";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { formatBalance } from "@/lib/utils/format/balance";
import { shortTokenAddress } from "@/lib/utils/format/address";
import { getWalletErrorMessage } from "@/lib/web3/contract-errors";
import { useErcs20Pagination } from "@/services/chain/hooks";
import type { Ercs20Rsp } from "@/services/chain/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

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

export function ProfileApplyListView() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const targetChainId = getSwapTargetChainId();
  const factoryAddress = getSpotPairFactoryAddress();
  const quoteToken = getWusdcAddress();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;

  const { data: tokenPage } = useErcs20Pagination({ currentPage: 1, pageSize: 20 });
  const [selectedToken, setSelectedToken] = useState<Ercs20Rsp | null>(null);
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);
  const [tokenOwner, setTokenOwner] = useState<`0x${string}` | null>(null);
  const [pairExists, setPairExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const handledTxRef = useRef<`0x${string}` | null>(null);

  const { writeContractAsync, isPending: isWritePending, reset: resetWrite } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (selectedToken) return;
    const tokenParam = searchParams.get("token")?.trim();
    if (!tokenParam || isNativeUsdcDepositAddress(tokenParam)) return;
    const match = tokenPage?.pageItems?.find(
      (row) => row.contract.toLowerCase() === tokenParam.toLowerCase()
    );
    if (match) setSelectedToken(match);
  }, [tokenPage?.pageItems, searchParams, selectedToken]);

  const baseToken = useMemo(() => {
    if (!selectedToken || isNativeUsdcDepositAddress(selectedToken.contract)) {
      return undefined;
    }
    return selectedToken.contract.toLowerCase() as `0x${string}`;
  }, [selectedToken]);

  useEffect(() => {
    if (!publicClient || !baseToken || !factoryAddress || !quoteToken) {
      setTokenOwner(null);
      setPairExists(null);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    void (async () => {
      try {
        const [owner, exists] = await Promise.all([
          publicClient.readContract({
            address: baseToken,
            abi: ercs20TokenAbi,
            functionName: "owner",
          }) as Promise<`0x${string}`>,
          readSpotPairExists({
            publicClient,
            factoryAddress,
            baseToken,
            quoteToken,
          }),
        ]);
        if (cancelled) return;
        setTokenOwner(owner);
        setPairExists(exists);
      } catch {
        if (!cancelled) {
          setTokenOwner(null);
          setPairExists(null);
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsChecking(false);
    };
  }, [publicClient, baseToken, factoryAddress, quoteToken]);

  useEffect(() => {
    if (!isSuccess || !selectedToken || !txHash) return;
    if (handledTxRef.current === txHash) return;
    handledTxRef.current = txHash;
    toast.success(t("profile.applyListSubmitted").replace("{symbol}", selectedToken.symbol));
    resetWrite();
    setTxHash(undefined);
    if (baseToken && publicClient && factoryAddress && quoteToken) {
      void readSpotPairExists({
        publicClient,
        factoryAddress,
        baseToken,
        quoteToken,
      }).then(setPairExists);
    }
  }, [
    isSuccess,
    selectedToken,
    txHash,
    t,
    resetWrite,
    baseToken,
    publicClient,
    factoryAddress,
    quoteToken,
  ]);

  const selectToken = useCallback((token: Ercs20Rsp) => {
    if (isNativeUsdcDepositAddress(token.contract)) {
      toast.error(t("profile.applyListNativeToken"));
      return;
    }
    setSelectedToken(token);
  }, [t]);

  const ownerMatches =
    Boolean(address) &&
    Boolean(tokenOwner) &&
    address!.toLowerCase() === tokenOwner!.toLowerCase();

  const busy = isWritePending || isConfirming;

  const canSubmit =
    isConnected &&
    Boolean(address) &&
    Boolean(selectedToken) &&
    Boolean(baseToken) &&
    isSpotPairFactoryConfigured() &&
    !wrongNetwork &&
    !busy;

  const submitHint = useMemo(() => {
    if (busy) return null;
    if (!isConnected || !address) return t("profile.notConnected");
    if (!selectedToken) return t("profile.selectTokenFirst");
    if (!isSpotPairFactoryConfigured()) return t("profile.spotPairFactoryNotConfigured");
    if (wrongNetwork) return t("swap.wrongNetwork");
    return null;
  }, [busy, isConnected, address, selectedToken, wrongNetwork, t]);

  async function handleConfirm() {
    if (!address || !baseToken || !factoryAddress || targetChainId == null || !publicClient) {
      return;
    }

    if (!isSpotPairFactoryConfigured()) {
      toast.error(t("profile.spotPairFactoryNotConfigured"));
      return;
    }

    if (wrongNetwork) {
      toast.error(t("swap.wrongNetwork"));
      return;
    }

    if (isChecking) {
      toast.error(t("profile.applyListChecking"));
      return;
    }

    if (!ownerMatches) {
      toast.error(t("profile.applyListNotOwner"));
      return;
    }

    if (pairExists) {
      toast.error(t("profile.applyListPairExists"));
      return;
    }

    resetWrite();
    setTxHash(undefined);
    handledTxRef.current = null;

    try {
      const hash = await executeSpotPairFactoryCreate({
        publicClient,
        account: address,
        writeContractAsync,
        factoryAddress,
        baseToken,
        chainId: targetChainId,
      });
      setTxHash(hash);
    } catch (error) {
      toast.error(
        getWalletErrorMessage(error, t("profile.applyListFailed"), {
          userRejected: t("wallet.userRejected"),
          revertMessages: {
            InvalidAddress: t("profile.applyListInvalidAddress"),
            NotERCS20: t("profile.applyListNotErcs20"),
            NotTokenOwner: t("profile.applyListNotOwner"),
            InvalidOpeningPrice: t("profile.applyListInvalidOpeningPrice"),
            OpeningPriceDecimalsTooHigh: t("profile.applyListInvalidOpeningPrice"),
            OpeningPriceTooHigh: t("profile.applyListInvalidOpeningPrice"),
            PairAlreadyExists: t("profile.applyListPairExists"),
          },
        })
      );
    }
  }

  const displaySymbol = selectedToken?.symbol ?? "—";
  const openingPriceLabel = selectedToken
    ? `${formatBalance(selectedToken.usdcSeedAmount)} USDC`
    : "—";

  return (
    <>
      <ProfileApplyListTokenSelectSheet
        open={tokenSheetOpen}
        onOpenChange={setTokenSheetOpen}
        onSelect={selectToken}
      />

      <section className={profileDetailSectionClass}>
        <ProfileBackLink
          href={ProfileRoutes.dashboard}
          label={t("profile.backToDashboard")}
          className="mb-4"
        />

        <div className="mx-auto w-full max-w-[480px]">
          <div className="rounded-[28px] bg-brand/10 p-1 shadow-lg ring-1 ring-brand/20">
            <div className="rounded-[24px] bg-card p-5 sm:p-6">
              <ProfileFormHeader
                tone="brand"
                icon={<ListPlusIcon aria-hidden />}
                title={t("profile.applyListSpot")}
                description={t("profile.applyListSpotDesc")}
              />

              <div className="space-y-4">
                <div className="bg-muted/50 border-border/60 space-y-3 rounded-2xl border p-3.5 sm:p-4">
                  <p className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t("profile.asset")}
                  </p>
                  <button
                    type="button"
                    className="group bg-card text-foreground ring-border inline-flex w-full items-center justify-between gap-3 rounded-xl py-2.5 pr-3 pl-2.5 text-sm font-semibold ring-1 transition hover:bg-muted/80"
                    aria-label={`${t("profile.selectToken")}: ${displaySymbol}`}
                    onClick={() => setTokenSheetOpen(true)}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {selectedToken ? <TokenIcon symbol={selectedToken.symbol} /> : null}
                      <span className="truncate">{displaySymbol}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs font-normal">
                      {t("profile.selectToken")}
                    </span>
                  </button>
                  {selectedToken ? (
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground shrink-0 text-xs">
                          {t("profile.tokenAddress")}
                        </dt>
                        <dd
                          className="text-foreground min-w-0 truncate font-mono text-xs"
                          title={selectedToken.contract}
                        >
                          {shortTokenAddress(selectedToken.contract)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground shrink-0 text-xs">
                          {t("profile.applyListOpeningPrice")}
                        </dt>
                        <dd className="text-brand min-w-0 truncate text-right tabular-nums text-xs font-semibold">
                          {openingPriceLabel}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground shrink-0 text-xs">
                          {t("profile.applyListTokenOwner")}
                        </dt>
                        <dd
                          className={cn(
                            "min-w-0 truncate font-mono text-xs",
                            ownerMatches ? "text-brand" : "text-muted-foreground"
                          )}
                          title={tokenOwner ?? undefined}
                        >
                          {isChecking
                            ? "…"
                            : tokenOwner
                              ? shortTokenAddress(tokenOwner)
                              : "—"}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </div>

                {pairExists ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-brand/20 bg-brand/5 px-3.5 py-3 text-sm">
                    {t("profile.applyListPairExists")}
                  </p>
                ) : null}

                {!isConnected ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-brand/20 bg-brand/5 px-3.5 py-3 text-sm">
                    {t("profile.notConnected")}
                  </p>
                ) : !isSpotPairFactoryConfigured() ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-brand/20 bg-brand/5 px-3.5 py-3 text-sm">
                    {t("profile.spotPairFactoryNotConfigured")}
                  </p>
                ) : wrongNetwork ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-brand/20 bg-brand/5 px-3.5 py-3 text-sm">
                    {t("swap.wrongNetwork")}
                  </p>
                ) : selectedToken && tokenOwner && !ownerMatches && !isChecking ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm">
                    {t("profile.applyListNotOwner")}
                  </p>
                ) : isChecking ? (
                  <p className="text-muted-foreground text-center text-xs">
                    {t("profile.applyListChecking")}
                  </p>
                ) : null}

                {submitHint && !canSubmit ? (
                  <p className="text-muted-foreground text-center text-xs">{submitHint}</p>
                ) : null}

                <Button
                  type="button"
                  className="h-11 w-full rounded-xl text-base"
                  onClick={() => void handleConfirm()}
                  disabled={!canSubmit}
                >
                  {busy
                    ? isWritePending
                      ? t("swap.confirmWallet")
                      : t("swap.confirming")
                    : isChecking
                      ? t("profile.applyListChecking")
                      : t("profile.confirmApplyList")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
