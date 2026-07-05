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
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Ercs20TokenSelectSheet } from "@/components/swap/ercs20-token-select-sheet";
import { SwapSettingsSheet } from "@/components/swap/swap-settings-sheet";
import { PageShell } from "@/components/layout/page-shell";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ercs20TokenAbi } from "@/lib/contracts/abis";
import {
  getDefaultErcs20TokenAddress,
  getErcs20FactoryAddress,
  getSwapTargetChainId,
  isSwapEnvConfigured,
} from "@/lib/config/swap-target";
import { minOutAfterSlippage, swapDeadlineTimestamp } from "@/lib/swap/min-out";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { findErcs20ListMetaByAddress } from "@/lib/tokens/ercs20-search";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";
import { cn } from "@/lib/utils";
import { useSwapSettings } from "@/hooks/use-swap-settings";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

const DISCONNECTED = "--";
const NATIVE_DECIMALS = 18;

const swapPageShellClass =
  "flex justify-center px-3 pt-8 pb-12 sm:px-4 sm:pt-10 lg:px-4 lg:pt-14 lg:pb-16";

function trimDecimalInput(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}

function TokenIcon({
  symbol,
  interactive = true,
}: {
  symbol: string;
  interactive?: boolean;
}) {
  const s = symbol.trim() || "TOKEN";
  return (
    <Image
      src={getTokenIconSrc(s)}
      alt=""
      width={28}
      height={28}
      className={cn(
        "size-7 shrink-0 rounded-full ring-1 ring-border/60 transition-transform duration-300 ease-out",
        interactive && "group-hover:scale-105"
      )}
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
  footer,
  className,
}: {
  label: string;
  balanceLabel: string;
  amount: string;
  onAmountChange?: (v: string) => void;
  amountReadOnly?: boolean;
  amountPlaceholder: string;
  tokenButton: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "bg-muted/50 border-border/60 space-y-1.5 rounded-2xl border p-3.5 sm:p-4",
        className
      )}
    >
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
          className="text-foreground placeholder:text-muted-foreground h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-transparent sm:text-3xl"
          aria-label={label}
        />
        {tokenButton}
      </div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export function SwapCard() {
  const { t } = useI18n();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();

  const targetChainId = getSwapTargetChainId();
  const factory = getErcs20FactoryAddress();
  const configured = isSwapEnvConfigured() && factory != null && targetChainId != null;

  const [buyMode, setBuyMode] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [sizePct, setSizePct] = useState(0);
  const [token, setToken] = useState<`0x${string}` | undefined>(() =>
    getDefaultErcs20TokenAddress()
  );
  const [pickedMeta, setPickedMeta] = useState<Ercs20TokenMeta | null>(() => {
    const addr = getDefaultErcs20TokenAddress();
    return addr ? findErcs20ListMetaByAddress(addr) ?? null : null;
  });
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

  const balanceQueryEnabled =
    !!address && isConnected && targetChainId != null;

  /** Native: `eth_getBalance` on the swap target chain (not the same code path as ERC-20). */
  const { data: nativeBal, refetch: refetchNativeBal } = useBalance({
    address,
    chainId: targetChainId ?? undefined,
    query: {
      enabled: balanceQueryEnabled,
    },
  });

  const {
    data: tokenBalRaw,
    isError: tokenBalReadError,
    refetch: refetchTokenBal,
  } = useTokenBalance({
    token,
    address,
    chainId: targetChainId ?? undefined,
    query: { enabled: balanceQueryEnabled && !!token },
  });

  const nativeBalLabel = useMemo(() => {
    if (!isConnected || !nativeBal) return DISCONNECTED;
    return formatUnits(nativeBal.value, nativeBal.decimals);
  }, [isConnected, nativeBal]);

  const tokenBalLabel = useMemo(() => {
    if (!isConnected || !address || !token) return DISCONNECTED;
    if (tokenBalReadError) return "—";
    if (typeof tokenBalRaw === "bigint")
      return formatUnits(tokenBalRaw, tokenDecimals);
    return DISCONNECTED;
  }, [
    isConnected,
    address,
    token,
    tokenBalReadError,
    tokenBalRaw,
    tokenDecimals,
  ]);

  const payBalanceWei = useMemo(() => {
    if (buyMode) return nativeBal?.value;
    if (typeof tokenBalRaw === "bigint") return tokenBalRaw;
    return undefined;
  }, [buyMode, nativeBal?.value, tokenBalRaw]);

  const canUsePayPresets =
    isConnected &&
    !wrongNetwork &&
    payBalanceWei != null &&
    payBalanceWei > BigInt(0);

  const applyPayPercent = useCallback(
    (pct: number) => {
      if (pct < 1 || pct > 100) return;
      const wei = buyMode
        ? nativeBal?.value
        : typeof tokenBalRaw === "bigint"
          ? tokenBalRaw
          : undefined;
      if (wei == null) return;
      const dec = buyMode
        ? (nativeBal?.decimals ?? NATIVE_DECIMALS)
        : tokenDecimals;
      const part = (wei * BigInt(pct)) / BigInt(100);
      setAmountIn(trimDecimalInput(formatUnits(part, dec)));
    },
    [buyMode, nativeBal, tokenBalRaw, tokenDecimals]
  );

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

  const outputDecimals = buyMode ? tokenDecimals : NATIVE_DECIMALS;
  const outputAmountStr =
    expectedOut != null ? formatUnits(expectedOut, outputDecimals) : "";

  /** Fixed-notional pool quote via public RPC (no wallet). Buys: 1 unit quote in; sells: 1 full token in. */
  const spotRefAmountIn = useMemo(() => {
    try {
      return buyMode
        ? parseUnits("1", NATIVE_DECIMALS)
        : parseUnits("1", tokenDecimals);
    } catch {
      return BigInt(0);
    }
  }, [buyMode, tokenDecimals]);

  const spotQuoteEnabled =
    !!token &&
    targetChainId != null &&
    configured &&
    spotRefAmountIn > BigInt(0);

  const { data: spotQuoteOut } = useReadContract({
    address: token,
    abi: ercs20TokenAbi,
    functionName: "getAmountOut",
    args: spotQuoteEnabled ? [spotRefAmountIn, buyMode] : undefined,
    chainId: targetChainId ?? undefined,
    query: { enabled: spotQuoteEnabled },
  });

  const spotExpectedOut =
    spotQuoteOut && Array.isArray(spotQuoteOut)
      ? (spotQuoteOut[0] as bigint)
      : undefined;

  /** Same convention as the form: buy → tokens received per 1 unit pay; sell → quote received per 1 token sold. */
  const spotPriceStr = useMemo(() => {
    if (
      spotExpectedOut == null ||
      spotExpectedOut <= BigInt(0) ||
      spotRefAmountIn <= BigInt(0)
    ) {
      return null;
    }
    if (buyMode) {
      return trimDecimalInput(formatUnits(spotExpectedOut, tokenDecimals));
    }
    return trimDecimalInput(formatUnits(spotExpectedOut, NATIVE_DECIMALS));
  }, [buyMode, spotRefAmountIn, spotExpectedOut, tokenDecimals]);

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
    setSizePct(0);
    void Promise.all([refetchNativeBal(), refetchTokenBal()]);
    resetWrite();
  }, [isSuccess, resetWrite, t, refetchNativeBal, refetchTokenBal]);

  const insufficient =
    parsedAmountIn != null &&
    parsedAmountIn > BigInt(0) &&
    (buyMode
      ? nativeBal != null && parsedAmountIn > nativeBal.value
      : typeof tokenBalRaw === "bigint" &&
          parsedAmountIn > tokenBalRaw);

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
      className="bg-muted/60 text-muted-foreground ring-border/70 inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 sm:py-2 sm:pr-3 sm:pl-2.5"
      aria-label={t("swap.native")}
      aria-disabled="true"
      disabled
    >
      <TokenIcon symbol="USDC" interactive={false} />
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
      <PageShell className={swapPageShellClass}>
        <section className="mx-auto w-full max-w-[480px]" aria-labelledby="swap-title">
          <p className="text-muted-foreground text-center text-sm" id="swap-title">
            {t("swap.envNotConfigured")}
          </p>
        </section>
      </PageShell>
    );
  }

  const busy = isWritePending || isConfirming;

  return (
    <PageShell className={swapPageShellClass}>
      <section className="mx-auto w-full max-w-[480px]" aria-labelledby="swap-title">
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
          persist({ slippageBps: bps, deadlineMinutes: m });
        }}
      />

      <div className="rounded-[28px] bg-muted/50 p-1 shadow-lg ring-1 ring-border/60">
        <div className="rounded-[24px] bg-card p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <h1
              id="swap-title"
              className="text-primary text-lg font-semibold tracking-tight sm:text-xl"
            >
              {t("swap.title")}
            </h1>
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              className="shrink-0 rounded-full shadow-md"
              aria-label={t("swap.settings")}
              onClick={() => {
                setSettingsMountKey((k) => k + 1);
                setSettingsOpen(true);
              }}
            >
              <Settings2Icon className="size-4" strokeWidth={1.5} />
            </Button>
          </div>

          <div className="relative flex flex-col gap-0">
            <AmountRow
              className="pb-6 sm:pb-7"
              label={t("swap.pay")}
              balanceLabel={buyMode ? nativeBalLabel : tokenBalLabel}
              amount={amountIn}
              onAmountChange={(v) => {
                setSizePct(0);
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
              footer={
                <SizePctControls
                  pct={sizePct}
                  disabled={!canUsePayPresets}
                  side={buyMode ? "buy" : "sell"}
                  onPctChange={(pct) => {
                    setSizePct(pct);
                    applyPayPercent(pct);
                  }}
                />
              }
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
                  setSizePct(0);
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
              className="pt-6 sm:pt-7"
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
              <dt>{t("swap.currentPrice")}</dt>
              <dd className="max-w-[min(100%,18rem)] text-right font-medium break-words tabular-nums sm:max-w-[22rem]">
                {token && spotPriceStr != null ? spotPriceStr : DISCONNECTED}
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
              "mt-5 h-12 w-full rounded-2xl border-0 text-base font-semibold shadow-md",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:!bg-[var(--primary)] disabled:!text-[var(--primary-foreground)] disabled:!opacity-100 disabled:brightness-[0.88] disabled:saturate-[0.92] disabled:shadow-none"
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
    </PageShell>
  );
}
