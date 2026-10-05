"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import { useWrongNetworkGate } from "@/components/wallet/wrong-network-gate";
import {
  getPerpsExchangeAddress,
  isPerpsExchangeConfigured,
} from "@/lib/config/perps-exchange";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import {
  executePerpsAddMargin,
  executePerpsWithdrawMargin,
} from "@/lib/contracts/perps-exchange";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import { formatBalance } from "@/lib/utils/format/balance";
import { cn } from "@/lib/utils";
import { getWalletErrorMessage } from "@/lib/web3/contract-errors";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { usePerpsOrdersUserBalance } from "@/services/perps/orders/hooks";

const DECIMALS = 18;

export type AdjustMarginTarget = {
  pairLabel: string;
  pairId: number;
  quoteSymbol: string;
  balanceMargin: bigint;
};

type MarginMode = "add" | "withdraw";

function sanitizeDecimal18(raw: string): string {
  const next = raw.replace(/[^\d.]/g, "");
  const dot = next.indexOf(".");
  if (dot < 0) return next;
  return `${next.slice(0, dot + 1)}${next.slice(dot + 1).replace(/\./g, "").slice(0, 18)}`;
}

function parsePositiveDecimal18(raw: string): bigint | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const v = parseUnits(trimmed, DECIMALS);
    return v > BigInt(0) ? v : undefined;
  } catch {
    return undefined;
  }
}

function trimDecimalInput(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}

export function PerpsAdjustMarginDialog({
  target,
  onOpenChange,
}: {
  target: AdjustMarginTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { address, isConnected, chainId } = useWallet();
  const { isAuthenticated } = useAuth();
  const { openConnectModal } = useConnectModal();
  const { reopenWrongNetwork } = useWrongNetworkGate();
  const publicClient = usePublicClient();
  const targetChainId = getSwapTargetChainId();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;

  const open = target != null;
  const [mode, setMode] = useState<MarginMode>("add");
  const [amount, setAmount] = useState("");
  const [sizePct, setSizePct] = useState(0);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const handledHashRef = useRef<`0x${string}` | null>(null);

  const { data: userBalance } = usePerpsOrdersUserBalance({
    enabled: open && isAuthenticated,
  });

  const availableAdd = useMemo(() => {
    return parseApiBigInt(userBalance?.balance) ?? BigInt(0);
  }, [userBalance?.balance]);

  const availableWithdraw = useMemo(() => {
    const m = target?.balanceMargin ?? BigInt(0);
    return m > BigInt(0) ? m : BigInt(0);
  }, [target?.balanceMargin]);

  const maxAmount = mode === "add" ? availableAdd : availableWithdraw;
  const parsedAmount = useMemo(() => parsePositiveDecimal18(amount), [amount]);

  const {
    writeContractAsync,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: targetChainId ?? undefined,
  });

  const busy = isWritePending || isConfirming;

  useEffect(() => {
    if (!open) {
      setMode("add");
      setAmount("");
      setSizePct(0);
      setTxHash(undefined);
      handledHashRef.current = null;
      resetWrite();
    }
  }, [open, resetWrite]);

  useEffect(() => {
    setAmount("");
    setSizePct(0);
  }, [mode, target?.pairId]);

  useEffect(() => {
    if (!isSuccess || !txHash) return;
    if (handledHashRef.current === txHash) return;
    handledHashRef.current = txHash;
    toast.success(mode === "add" ? t("perps.marginAdded") : t("perps.marginRemoved"));
    setAmount("");
    setSizePct(0);
    setTxHash(undefined);
    resetWrite();
    void queryClient.invalidateQueries({ queryKey: ["perps", "orders", "positions"] });
    void queryClient.invalidateQueries({ queryKey: ["perps", "orders", "user-balance"] });
    void queryClient.invalidateQueries({ queryKey: ["perps", "accounts"] });
    onOpenChange(false);
  }, [isSuccess, txHash, mode, t, resetWrite, queryClient, onOpenChange]);

  const applyPercent = useCallback(
    (pct: number) => {
      setSizePct(pct);
      if (pct < 1 || maxAmount <= BigInt(0)) {
        setAmount("");
        return;
      }
      const part = (maxAmount * BigInt(pct)) / BigInt(100);
      setAmount(trimDecimalInput(formatUnits(part, DECIMALS)));
    },
    [maxAmount]
  );

  const quote = target?.quoteSymbol ?? "USDC";
  const amountError = useMemo(() => {
    if (!amount.trim() || parsedAmount == null) return null;
    if (parsedAmount > maxAmount) {
      return mode === "add" ? t("perps.insufficientBalance") : t("perps.exceedsWithdrawable");
    }
    return null;
  }, [amount, parsedAmount, maxAmount, mode, t]);

  async function handleSubmit() {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    if (wrongNetwork) {
      reopenWrongNetwork();
      return;
    }
    if (!isPerpsExchangeConfigured()) {
      toast.error(t("perps.exchangeNotConfigured"));
      return;
    }
    const exchangeAddress = getPerpsExchangeAddress();
    if (parsedAmount == null || !exchangeAddress || target == null || targetChainId == null) {
      toast.error(t("perps.invalidAmount"));
      return;
    }
    if (parsedAmount > maxAmount) {
      toast.error(
        mode === "add" ? t("perps.insufficientBalance") : t("perps.exceedsWithdrawable")
      );
      return;
    }

    try {
      const writeParams = {
        publicClient,
        account: address,
        writeContractAsync,
        exchangeAddress,
        marketId: BigInt(target.pairId),
        amount: parsedAmount,
        chainId: targetChainId,
      };
      const hash =
        mode === "add"
          ? await executePerpsAddMargin(writeParams)
          : await executePerpsWithdrawMargin(writeParams);
      setTxHash(hash);
    } catch (error) {
      toast.error(
        getWalletErrorMessage(error, t("perps.marginFailed"), {
          userRejected: t("perps.walletRejected"),
        })
      );
    }
  }

  const submitLabel = !isConnected
    ? t("perps.connectToTrade")
    : wrongNetwork
      ? t("swap.wrongNetwork")
      : busy
        ? isConfirming
          ? t("perps.marginConfirming")
          : t("perps.marginSubmitting")
        : mode === "add"
          ? t("perps.confirmAddMargin")
          : t("perps.confirmWithdrawMargin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
          "rounded-2xl ring-1 ring-border/60 sm:max-w-md"
        )}
      >
        <div className="border-border/60 bg-brand/5 border-b px-5 pt-5 pb-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/20">
              <WalletIcon aria-hidden className="size-5" />
            </div>
            <DialogHeader className="min-w-0 flex-1 gap-1.5 text-left sm:place-items-start">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t("perps.adjustMargin")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {target?.pairLabel ?? "—"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as MarginMode)}
            className="w-full"
          >
            <TabsList className="h-9 w-full">
              <TabsTrigger value="add" className="flex-1 text-xs sm:text-sm">
                {t("perps.addMargin")}
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1 text-xs sm:text-sm">
                {t("perps.withdrawMargin")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="adjust-margin-amount">{t("perps.marginAmount")}</Label>
            <div className="relative">
              <Input
                id="adjust-margin-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                disabled={busy}
                aria-invalid={amountError != null}
                onChange={(e) => {
                  setSizePct(0);
                  setAmount(sanitizeDecimal18(e.target.value));
                }}
                className="h-12 rounded-2xl pr-16"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium">
                {quote}
              </span>
            </div>
            {amountError ? (
              <p className="text-destructive text-xs" role="alert">
                {amountError}
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs tabular-nums">
              {mode === "add"
                ? t("perps.availableMargin")
                : t("perps.withdrawableMargin")}
              {": "}
              {formatBalance(maxAmount, DECIMALS)} {quote}
            </p>
          </div>

          <SizePctControls
            pct={sizePct}
            onPctChange={applyPercent}
            disabled={busy || maxAmount <= BigInt(0)}
            side={mode === "add" ? "buy" : "sell"}
          />
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2.5 rounded-b-2xl border-t border-border/60 bg-muted/30 px-5 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl sm:w-auto sm:min-w-28"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("perps.close")}
          </Button>
          <Button
            type="button"
            className="h-11 w-full rounded-xl sm:w-auto sm:min-w-28"
            disabled={
              busy ||
              (isConnected &&
                !wrongNetwork &&
                (parsedAmount == null || amountError != null))
            }
            onClick={() => void handleSubmit()}
          >
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
