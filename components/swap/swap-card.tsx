"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDownIcon, Settings2Icon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import {
  useBalance,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Ercs20TokenSelectSheet } from "@/components/swap/ercs20-token-select-sheet";
import { SwapSettingsSheet } from "@/components/swap/swap-settings-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ercs20TokenAbi } from "@/lib/contracts/ercs20-abi";
import {
  getDefaultErcs20TokenAddress,
  getErcs20FactoryAddress,
  getSwapTargetChainId,
  isSwapEnvConfigured,
} from "@/lib/config/swap-target";
import { minOutAfterSlippage, swapDeadlineTimestamp } from "@/lib/swap/min-out";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";
import { cn } from "@/lib/utils";
import { useSwapSettings } from "@/hooks/use-swap-settings";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

const DISCONNECTED = "--";
const NATIVE_DECIMALS = 18;

function TokenIcon({ symbol }: { symbol: string }) {
  const s = symbol.trim() || "TOKEN";
  return (
    <Image
      src={getTokenIconSrc(s)}
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-border/60 transition-transform duration-300 ease-out group-hover:scale-105"
      priority
      unoptimized
    />
  );
}

function AmountRow({
  label,
  balanceLabel,
  amount,
  onAmountChange,
  amountReadOnly,
  amountPlaceholder,
  tokenButton,
}: {
  label: string;
  balanceLabel: string;
  amount: string;
  onAmountChange?: (v: string) => void;
  amountReadOnly?: boolean;
  amountPlaceholder: string;
  tokenButton: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-muted/50 border-border/60 space-y-1.5 rounded-2xl border p-2.5 sm:p-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
        <span>{label}</span>
        <span>
          {t("swap.balance")}: {balanceLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Input
          type="text"
          inputMode="decimal"
          readOnly={amountReadOnly}
          value={amount}
          onChange={
            onAmountChange
              ? (e) => onAmountChange(e.target.value.replace(/[^\d.]/g, ""))
              : undefined
          }
          placeholder={amountPlaceholder}
          className="text-foreground placeholder:text-muted-foreground h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 focus-visible:ring-0 sm:text-3xl"
          aria-label={label}
        />
        {tokenButton}
      </div>
    </div>
  );
}

export function SwapCard() {
  const { t } = useI18n();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const targetChainId = getSwapTargetChainId();
  const factory = getErcs20FactoryAddress();
  const configured = isSwapEnvConfigured() && factory != null && targetChainId != null;

  const [buyMode, setBuyMode] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [token, setToken] = useState<`0x${string}` | undefined>(() =>
    getDefaultErcs20TokenAddress()
  );
  const [pickedMeta, setPickedMeta] = useState<Ercs20TokenMeta | null>(null);
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMountKey, setSettingsMountKey] = useState(0);

  const {
    slippageBps,
    setSlippageBps,
    deadlineMinutes,
    setDeadlineMinutes,
    persist,
  } = useSwapSettings();

  const wrongNetwork =
    configured && isConnected && targetChainId != null && chainId !== targetChainId;

  const { data: decimalsData } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "decimals",
    chainId: targetChainId ?? undefined,
    query: {
      enabled: !!token && targetChainId != null,
    },
  });

  const tokenDecimals =
    typeof decimalsData === "number" && decimalsData >= 0 ? decimalsData : 18;

  const { data: symbolOnChain } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "symbol",
    chainId: targetChainId ?? undefined,
    query: { enabled: !!token && targetChainId != null },
  });

  const displaySymbol =
    pickedMeta?.symbol || (symbolOnChain ? String(symbolOnChain) : t("swap.stock"));

  const inputDecimals = buyMode ? NATIVE_DECIMALS : tokenDecimals;

  const parsedAmountIn = useMemo(() => {
    const s = amountIn.trim();
    if (!s) return BigInt(0);
    try {
      return parseUnits(s, inputDecimals);
    } catch {
      return undefined;
    }
  }, [amountIn, inputDecimals]);

  const { data: nativeBal } = useBalance({
    address,
    chainId: targetChainId ?? undefined,
    query: {
      enabled: !!address && isConnected && targetChainId != null,
    },
  });

  const { data: tokenBal } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: targetChainId ?? undefined,
    query: {
      enabled: !!token && !!address && isConnected && targetChainId != null,
    },
  });

  const nativeBalLabel = useMemo(() => {
    if (!isConnected || !nativeBal) return DISCONNECTED;
    return formatUnits(nativeBal.value, nativeBal.decimals);
  }, [isConnected, nativeBal]);

  const tokenBalLabel = useMemo(() => {
    if (!isConnected || tokenBal == null) return DISCONNECTED;
    return formatUnits(tokenBal as bigint, tokenDecimals);
  }, [isConnected, tokenBal, tokenDecimals]);

  const quoteEnabled =
    !!token &&
    targetChainId != null &&
    parsedAmountIn != null &&
    parsedAmountIn > BigInt(0);

  const { data: quoteOut } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "getAmountOut",
    args:
      quoteEnabled && parsedAmountIn != null
        ? [parsedAmountIn, buyMode]
        : undefined,
    chainId: targetChainId ?? undefined,
    query: { enabled: quoteEnabled },
  });

  const expectedOut =
    quoteOut && Array.isArray(quoteOut) ? (quoteOut[0] as bigint) : undefined;
  const feeOut =
    quoteOut && Array.isArray(quoteOut) ? (quoteOut[1] as bigint) : undefined;

  const outputDecimals = buyMode ? tokenDecimals : NATIVE_DECIMALS;
  const outputAmountStr =
    expectedOut != null ? formatUnits(expectedOut, outputDecimals) : "";

  const { data: reserves } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "getReserves",
    chainId: targetChainId ?? undefined,
    query: { enabled: !!token && targetChainId != null },
  });

  const reserveLabels = useMemo(() => {
    if (!reserves || !Array.isArray(reserves)) {
      return { tok: DISCONNECTED, quote: DISCONNECTED };
    }
    const [rTok, rQuote] = reserves as [bigint, bigint];
    return {
      tok: formatUnits(rTok, tokenDecimals),
      quote: formatUnits(rQuote, NATIVE_DECIMALS),
    };
  }, [reserves, tokenDecimals]);

  const feePctApprox = useMemo(() => {
    if (expectedOut == null || feeOut == null) return null;
    const sum = expectedOut + feeOut;
    if (sum === BigInt(0)) return null;
    return (Number(feeOut) / Number(sum)) * 100;
  }, [expectedOut, feeOut]);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: targetChainId ?? undefined,
  });

  useEffect(() => {
    if (!writeError) return;
    toast.error(t("swap.swapFailed"), {
      description: writeError.message.slice(0, 200),
    });
  }, [writeError, t]);

  useEffect(() => {
    if (!isSuccess) return;
    toast.success(t("swap.swapSuccess"));
    setAmountIn("");
    resetWrite();
  }, [isSuccess, resetWrite, t]);

  const insufficient =
    parsedAmountIn != null &&
    parsedAmountIn > BigInt(0) &&
    (buyMode
      ? nativeBal != null && parsedAmountIn > nativeBal.value
      : tokenBal != null && parsedAmountIn > (tokenBal as bigint));

  const canSubmit =
    configured &&
    isConnected &&
    !wrongNetwork &&
    !!token &&
    quoteEnabled &&
    expectedOut != null &&
    !insufficient &&
    parsedAmountIn !== undefined;

  const handleSwap = useCallback(() => {
    if (
      !token ||
      targetChainId == null ||
      parsedAmountIn == null ||
      parsedAmountIn === BigInt(0) ||
      expectedOut == null
    ) {
      return;
    }
    const deadline = swapDeadlineTimestamp(deadlineMinutes);
    if (buyMode) {
      const minTok = minOutAfterSlippage(expectedOut, slippageBps);
      writeContract({
        address: token,
        abi: ercs20TokenAbi,
        functionName: "buy",
        args: [minTok, deadline],
        value: parsedAmountIn,
        chainId: targetChainId,
      });
    } else {
      const minQuote = minOutAfterSlippage(expectedOut, slippageBps);
      writeContract({
        address: token,
        abi: ercs20TokenAbi,
        functionName: "sell",
        args: [parsedAmountIn, minQuote, deadline],
        chainId: targetChainId,
      });
    }
  }, [
    token,
    targetChainId,
    parsedAmountIn,
    expectedOut,
    buyMode,
    slippageBps,
    deadlineMinutes,
    writeContract,
  ]);

  const nativeTokenButton = (
    <button
      type="button"
      className="group bg-card text-foreground ring-border inline-flex shrink-0 cursor-default items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 sm:py-2 sm:pr-3 sm:pl-2.5"
      aria-label={t("swap.native")}
    >
      <TokenIcon symbol="USDC" />
      <span className="max-w-[6.5rem] truncate sm:max-w-[7rem]">{t("swap.native")}</span>
    </button>
  );

  const ercs20TokenButton = (
    <button
      type="button"
      className="group bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 transition hover:bg-muted/80 sm:py-2 sm:pr-3 sm:pl-2.5"
      aria-label={`${t("swap.selectToken")}: ${displaySymbol}`}
      onClick={() => setTokenSheetOpen(true)}
      disabled={!configured}
    >
      <TokenIcon symbol={displaySymbol} />
      <span className="max-w-[6.5rem] truncate sm:max-w-[7rem]">{displaySymbol}</span>
    </button>
  );

  if (!configured) {
    return (
      <section
        className="mx-auto w-full max-w-[480px] px-4 py-8 sm:py-12"
        aria-labelledby="swap-title"
      >
        <p className="text-muted-foreground text-center text-sm" id="swap-title">
          {t("swap.envNotConfigured")}
        </p>
      </section>
    );
  }

  const busy = isWritePending || isConfirming;

  return (
    <section
      className="mx-auto w-full max-w-[480px] px-4 py-8 sm:py-12"
      aria-labelledby="swap-title"
    >
      {factory && targetChainId != null ? (
        <Ercs20TokenSelectSheet
          open={tokenSheetOpen}
          onOpenChange={setTokenSheetOpen}
          factory={factory}
          chainId={targetChainId}
          onSelect={(meta) => {
            setToken(meta.address);
            setPickedMeta(meta);
          }}
        />
      ) : null}

      <SwapSettingsSheet
        mountKey={settingsMountKey}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        slippageBps={slippageBps}
        deadlineMinutes={deadlineMinutes}
        onSave={(bps, m) => {
          setSlippageBps(bps);
          setDeadlineMinutes(m);
          persist();
        }}
      />

      <div className="rounded-[28px] bg-muted/50 p-1 shadow-lg ring-1 ring-border/60">
        <div className="rounded-[24px] bg-card p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <h1
              id="swap-title"
              className="text-primary text-lg font-semibold tracking-tight sm:text-xl"
            >
              {t("swap.title")}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              aria-label={t("swap.settings")}
              onClick={() => {
                setSettingsMountKey((k) => k + 1);
                setSettingsOpen(true);
              }}
            >
              <Settings2Icon className="size-4" strokeWidth={1.5} />
            </Button>
          </div>

          {wrongNetwork ? (
            <div className="mb-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground mb-2">{t("swap.wrongNetwork")}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSwitching}
                onClick={() =>
                  targetChainId != null &&
                  void switchChainAsync?.({ chainId: targetChainId })
                }
              >
                {t("swap.switchNetwork")}
              </Button>
            </div>
          ) : null}

          <div className="relative flex flex-col gap-0">
            <AmountRow
              label={t("swap.pay")}
              balanceLabel={buyMode ? nativeBalLabel : tokenBalLabel}
              amount={amountIn}
              onAmountChange={(v) => {
                let x = v.replace(/[^\d.]/g, "");
                const dot = x.indexOf(".");
                if (dot !== -1) {
                  x =
                    x.slice(0, dot + 1) +
                    x.slice(dot + 1).replace(/\./g, "");
                }
                setAmountIn(x);
              }}
              amountPlaceholder={
                isConnected ? t("swap.enterAmount") : DISCONNECTED
              }
              tokenButton={buyMode ? nativeTokenButton : ercs20TokenButton}
            />
            <div className="relative z-10 flex justify-center -my-4 sm:-my-4.5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-9 shrink-0 rounded-xl border-[3px] border-border/60 bg-card shadow-md transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-lg active:scale-95 sm:size-10 sm:border-4"
                aria-label={t("swap.flip")}
                aria-pressed={!buyMode}
                onClick={() => {
                  setBuyMode((v) => !v);
                  setAmountIn("");
                }}
              >
                <ArrowDownIcon
                  className={cn(
                    "size-4 transition-transform duration-300 ease-out",
                    buyMode ? "rotate-180" : "rotate-0"
                  )}
                  strokeWidth={1.5}
                />
              </Button>
            </div>
            <AmountRow
              label={t("swap.receive")}
              balanceLabel={buyMode ? tokenBalLabel : nativeBalLabel}
              amount={outputAmountStr}
              amountReadOnly
              amountPlaceholder={
                isConnected ? t("swap.outputEstimate") : DISCONNECTED
              }
              tokenButton={buyMode ? ercs20TokenButton : nativeTokenButton}
            />
          </div>

          <dl className="text-muted-foreground mt-3 space-y-2 px-1 text-xs sm:mt-4 sm:text-sm">
            <div className="flex justify-between gap-4">
              <dt>{t("swap.priceImpact")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {token && quoteEnabled ? "—" : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.reserveToken")}</dt>
              <dd className="text-foreground text-right font-medium tabular-nums">
                {token ? reserveLabels.tok : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.reserveQuote")}</dt>
              <dd className="text-foreground text-right font-medium tabular-nums">
                {token ? reserveLabels.quote : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.protocolFee")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {feePctApprox != null
                  ? `~${feePctApprox.toFixed(2)}%`
                  : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.slippage")}</dt>
              <dd className="text-foreground text-right font-medium tabular-nums">
                {(slippageBps / 100).toFixed(2)}%
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            disabled={
              !isConnected ||
              wrongNetwork ||
              busy ||
              !canSubmit ||
              insufficient ||
              parsedAmountIn === undefined
            }
            className={cn(
              "mt-5 h-12 w-full rounded-2xl border-0 text-base font-semibold",
              "bg-primary text-primary-foreground shadow-md hover:enabled:bg-primary/90",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:!bg-primary disabled:!text-primary-foreground disabled:!opacity-100 disabled:brightness-[0.88] disabled:saturate-[0.92] disabled:shadow-none"
            )}
            onClick={handleSwap}
          >
            {!isConnected
              ? t("swap.disconnectedHint")
              : insufficient
                ? t("swap.insufficientBalance")
                : busy
                  ? isConfirming
                    ? t("swap.confirming")
                    : t("swap.confirmWallet")
                  : !token
                    ? t("swap.pickToken")
                    : parsedAmountIn === undefined
                      ? t("swap.invalidAmount")
                      : t("swap.swapAction")}
          </Button>
        </div>
      </div>
    </section>
  );
}
