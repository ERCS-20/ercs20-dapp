"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListPlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileFormCardShell } from "@/components/profile/shared/profile-form-card-shell";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { ProfileApplyListTokenSelectSheet } from "@/components/profile/apply-list/profile-apply-list-token-select-sheet";
import { profileDetailSectionClass } from "@/components/profile/shell/profile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useErcs20OpeningPrice } from "@/hooks/use-ercs20-opening-price";
import { useWallet } from "@/hooks/use-wallet";
import {
  getPerpsPairFactoryAddress,
  isPerpsPairFactoryConfigured,
} from "@/lib/config/perps-pair-factory";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import { ercs20TokenAbi, perpsPairFactoryAbi } from "@/lib/contracts/abis";
import { isNativeUsdcDepositAddress } from "@/lib/contracts/global-spot-vault";
import {
  executePerpsPairFactoryCreate,
  readPerpsMarketExists,
  readPerpsPairFactoryFee,
} from "@/lib/contracts/perps-pair-factory";
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

/** Local wall time → `datetime-local` value (`YYYY-MM-DDTHH:mm`). */
function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` → Unix seconds (contract `openingTime`). */
function datetimeLocalToUnixSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = new Date(trimmed).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

/** Default opening: next full hour, at least ~1h ahead. */
function defaultOpeningDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return toDatetimeLocalValue(d.getTime());
}

export function ProfileApplyListPerpsView() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const targetChainId = getSwapTargetChainId();
  const factoryAddress = getPerpsPairFactoryAddress();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;

  const { data: nativeBal } = useBalance({
    address,
    chainId: targetChainId,
    query: { enabled: Boolean(address) && targetChainId != null },
  });

  const { data: tokenPage } = useErcs20Pagination({ currentPage: 1, pageSize: 20 });
  const [selectedToken, setSelectedToken] = useState<Ercs20Rsp | null>(null);
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);
  const [openingTimeLocal, setOpeningTimeLocal] = useState(defaultOpeningDatetimeLocal);
  const [tokenOwner, setTokenOwner] = useState<`0x${string}` | null>(null);
  const [marketExists, setMarketExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const handledTxRef = useRef<`0x${string}` | null>(null);

  const { writeContractAsync, isPending: isWritePending, reset: resetWrite } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const {
    data: listingFee,
    isLoading: isFeeLoading,
    isError: isFeeError,
    refetch: refetchFee,
  } = useReadContract({
    address: factoryAddress,
    abi: perpsPairFactoryAbi,
    functionName: "fee",
    chainId: targetChainId,
    query: {
      enabled: Boolean(factoryAddress) && targetChainId != null,
      staleTime: 30_000,
    },
  });
  const listingFeeWei =
    typeof listingFee === "bigint" ? listingFee : listingFee != null ? BigInt(listingFee as string | number) : null;

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

  const openingTimeUnix = useMemo(
    () => datetimeLocalToUnixSeconds(openingTimeLocal),
    [openingTimeLocal]
  );

  const openingTimeValid =
    openingTimeUnix != null && openingTimeUnix * 1000 > Date.now();

  const {
    label: openingPriceLabel,
    isLoading: isOpeningPriceLoading,
    hasValidPrice: hasValidOpeningPrice,
  } = useErcs20OpeningPrice({
    tokenAddress: baseToken,
    tokenDecimals: selectedToken?.decimals ?? 18,
    chainId: targetChainId ?? undefined,
    enabled: Boolean(baseToken),
  });

  const datetimeMin = useMemo(() => toDatetimeLocalValue(Date.now() + 60_000), []);

  useEffect(() => {
    if (!publicClient || !baseToken || !factoryAddress) {
      setTokenOwner(null);
      setMarketExists(null);
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
          readPerpsMarketExists({
            publicClient,
            factoryAddress,
            baseToken,
          }),
        ]);
        if (cancelled) return;
        setTokenOwner(owner);
        setMarketExists(exists);
      } catch {
        if (!cancelled) {
          setTokenOwner(null);
          setMarketExists(null);
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsChecking(false);
    };
  }, [publicClient, baseToken, factoryAddress]);

  useEffect(() => {
    if (!isSuccess || !selectedToken || !txHash) return;
    if (handledTxRef.current === txHash) return;
    handledTxRef.current = txHash;
    toast.success(t("profile.applyListSubmitted").replace("{symbol}", selectedToken.symbol));
    resetWrite();
    setTxHash(undefined);
    if (baseToken && publicClient && factoryAddress) {
      void readPerpsMarketExists({
        publicClient,
        factoryAddress,
        baseToken,
      }).then(setMarketExists);
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
  ]);

  const selectToken = useCallback(
    (token: Ercs20Rsp) => {
      if (isNativeUsdcDepositAddress(token.contract)) {
        toast.error(t("profile.applyListNativeToken"));
        return;
      }
      setSelectedToken(token);
    },
    [t]
  );

  const ownerMatches =
    Boolean(address) &&
    Boolean(tokenOwner) &&
    address!.toLowerCase() === tokenOwner!.toLowerCase();

  // Arc native USDC: fee() is wei; prefer chain decimals, fallback 18.
  const feeDecimals = nativeBal?.decimals ?? 18;
  const feeLabel = isFeeLoading
    ? "…"
    : isFeeError || listingFeeWei == null
      ? "—"
      : `${formatBalance(listingFeeWei, feeDecimals)} USDC`;

  const hasEnoughFee =
    listingFeeWei == null ||
    nativeBal == null ||
    nativeBal.value >= listingFeeWei;

  const busy = isWritePending || isConfirming;

  const canSubmit =
    isConnected &&
    Boolean(address) &&
    Boolean(selectedToken) &&
    Boolean(baseToken) &&
    isPerpsPairFactoryConfigured() &&
    openingTimeValid &&
    listingFeeWei != null &&
    hasEnoughFee &&
    !wrongNetwork &&
    !busy;

  const submitHint = useMemo(() => {
    if (busy) return null;
    if (!isConnected || !address) return t("profile.notConnected");
    if (!selectedToken) return t("profile.selectTokenFirst");
    if (!isPerpsPairFactoryConfigured()) return t("profile.perpsPairFactoryNotConfigured");
    if (wrongNetwork) return t("swap.wrongNetwork");
    if (!openingTimeLocal.trim()) return t("profile.applyListOpeningTimeRequired");
    if (!openingTimeValid) return t("profile.applyListInvalidOpeningTime");
    if (isFeeError) return t("profile.applyListFeeLoadFailed");
    if (listingFeeWei != null && !hasEnoughFee) return t("profile.insufficientBalance");
    return null;
  }, [
    busy,
    isConnected,
    address,
    selectedToken,
    wrongNetwork,
    openingTimeLocal,
    openingTimeValid,
    isFeeError,
    listingFeeWei,
    hasEnoughFee,
    t,
  ]);

  async function handleConfirm() {
    if (
      !address ||
      !baseToken ||
      !factoryAddress ||
      targetChainId == null ||
      !publicClient ||
      openingTimeUnix == null ||
      listingFeeWei == null
    ) {
      return;
    }

    if (!isPerpsPairFactoryConfigured()) {
      toast.error(t("profile.perpsPairFactoryNotConfigured"));
      return;
    }

    if (wrongNetwork) {
      toast.error(t("swap.wrongNetwork"));
      return;
    }

    if (!openingTimeValid) {
      toast.error(t("profile.applyListInvalidOpeningTime"));
      return;
    }

    if (!hasEnoughFee) {
      toast.error(t("profile.insufficientBalance"));
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

    if (marketExists) {
      toast.error(t("profile.applyListPerpsMarketExists"));
      return;
    }

    if (!hasValidOpeningPrice) {
      toast.error(t("profile.applyListInvalidOpeningPrice"));
      return;
    }

    resetWrite();
    setTxHash(undefined);
    handledTxRef.current = null;

    try {
      // Refresh fee right before send — IncorrectFee if stale.
      const fee = await readPerpsPairFactoryFee({ publicClient, factoryAddress });
      void refetchFee();

      const hash = await executePerpsPairFactoryCreate({
        publicClient,
        account: address,
        writeContractAsync,
        factoryAddress,
        baseToken,
        openingTime: BigInt(openingTimeUnix),
        fee,
        chainId: targetChainId,
      });
      setTxHash(hash);
    } catch (error) {
      toast.error(
        getWalletErrorMessage(error, t("profile.applyListFailed"), {
          userRejected: t("wallet.userRejected"),
          revertMessages: {
            IncorrectFee: t("profile.applyListIncorrectFee"),
            InvalidAddress: t("profile.applyListInvalidAddress"),
            InvalidOpeningTime: t("profile.applyListInvalidOpeningTime"),
            NotERCS20: t("profile.applyListNotErcs20"),
            NotTokenOwner: t("profile.applyListNotOwner"),
            MarketAlreadyExists: t("profile.applyListPerpsMarketExists"),
            OpeningPriceDecimalsTooHigh: t("profile.applyListInvalidOpeningPrice"),
            OpeningPriceTooHigh: t("profile.applyListInvalidOpeningPrice"),
            InsuranceAccountNotSet: t("profile.applyListFailed"),
          },
        })
      );
    }
  }

  const displaySymbol = selectedToken?.symbol ?? "—";
  const openingPriceDisplay = !selectedToken
    ? "—"
    : isOpeningPriceLoading
      ? "…"
      : (openingPriceLabel ?? "—");

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

<ProfileFormCardShell>
              <ProfileFormHeader
              icon={<ListPlusIcon aria-hidden />}
                title={t("profile.applyListPerps")}
                description={t("profile.applyListPerpsDesc")}
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
                        <dd className="text-primary min-w-0 truncate text-right tabular-nums text-xs font-semibold">
                          {openingPriceDisplay}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground shrink-0 text-xs">
                          {t("profile.applyListTokenOwner")}
                        </dt>
                        <dd
                          className={cn(
                            "min-w-0 truncate font-mono text-xs",
                            ownerMatches ? "text-primary" : "text-muted-foreground"
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

                <div className="bg-muted/50 border-border/60 space-y-2 rounded-2xl border p-3.5 sm:p-4">
                  <label
                    htmlFor="perps-apply-opening-time"
                    className="text-muted-foreground text-xs font-medium sm:text-sm"
                  >
                    {t("profile.applyListOpeningTime")}
                  </label>
                  <Input
                    id="perps-apply-opening-time"
                    type="datetime-local"
                    className="h-10 rounded-xl"
                    min={datetimeMin}
                    value={openingTimeLocal}
                    onChange={(e) => setOpeningTimeLocal(e.target.value)}
                  />
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    {t("profile.applyListOpeningTimeHint")}
                  </p>
                </div>

                <div className="bg-primary/5 border-primary/20 flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-sm">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("profile.applyListListingFee")}
                  </span>
                  <span className="text-primary tabular-nums text-sm font-semibold">
                    {feeLabel}
                  </span>
                </div>

                {marketExists ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3.5 py-3 text-sm">
                    {t("profile.applyListPerpsMarketExists")}
                  </p>
                ) : null}

                {!isConnected ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3.5 py-3 text-sm">
                    {t("profile.notConnected")}
                  </p>
                ) : !isPerpsPairFactoryConfigured() ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3.5 py-3 text-sm">
                    {t("profile.perpsPairFactoryNotConfigured")}
                  </p>
                ) : wrongNetwork ? (
                  <p className="text-muted-foreground rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3.5 py-3 text-sm">
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
        </ProfileFormCardShell>
      </section>
    </>
  );
}
