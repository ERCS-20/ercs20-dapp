"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2Icon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout/page-shell";
import {
  getErcs20FactoryAddress,
  getSwapTargetChainId,
  isSwapEnvConfigured,
} from "@/lib/config/swap-target";
import { ercs20FactoryAbi } from "@/lib/contracts/ercs20-factory-abi";
import { getErcs20CreateFromReceipt } from "@/lib/contracts/ercs20-factory-receipt";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useWrongNetworkGate } from "@/components/wallet/wrong-network-gate";
import { useI18n } from "@/providers/i18n-provider";

const DECIMALS = 18;

/** scale = 10^36 so (seed * scale) / supply preserves many fractional digits */
const PRICE_QUOTIENT_SCALE = (() => {
  let r = BigInt(1);
  const ten = BigInt(10);
  for (let i = 0; i < 36; i++) r *= ten;
  return r;
})();

const ercs20FieldInputClass =
  "h-12 rounded-2xl px-4 text-base md:text-base";

function sanitizeDecimal18(raw: string): string {
  let x = raw.replace(/[^\d.]/g, "");
  const dot = x.indexOf(".");
  if (dot !== -1) {
    x = x.slice(0, dot + 1) + x.slice(dot + 1).replace(/\./g, "");
  }
  const parts = x.split(".");
  if (parts.length > 1 && parts[1] != null && parts[1].length > DECIMALS) {
    x = `${parts[0]}.${parts[1].slice(0, DECIMALS)}`;
  }
  return x;
}

function trimDecimalZeros(s: string): string {
  if (!s.includes(".")) return s;
  const t = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return t === "" ? "0" : t;
}

/** Parsed as `parseUnits(s, 18)`; `undefined` if empty, invalid, or zero. */
function parsePositiveDecimal18(s: string): bigint | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  try {
    const v = parseUnits(trimmed, DECIMALS);
    return v > BigInt(0) ? v : undefined;
  } catch {
    return undefined;
  }
}

type DeployFieldError = "wallet" | "name" | "symbol" | "supply" | "seed";

type DeployResult =
  | {
      txHash: `0x${string}`;
      tokenAddress: `0x${string}`;
      index: bigint;
    }
  | { txHash: `0x${string}`; parseFailed: true };

function InlineFieldError({ children }: { children: string }) {
  return (
    <p className="text-destructive mt-1 text-sm leading-snug" role="alert">
      {children}
    </p>
  );
}

function copyViaExecCommand(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.margin = "0";
    ta.style.border = "none";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function FactoryCreateCard() {
  const { t } = useI18n();
  const chainId = useChainId();
  const { reopenWrongNetwork } = useWrongNetworkGate();
  const { address, isConnected } = useWallet();

  const targetChainId = getSwapTargetChainId();
  const factory = getErcs20FactoryAddress();
  const configured =
    isSwapEnvConfigured() && factory != null && targetChainId != null;

  const wrongNetwork =
    configured &&
    isConnected &&
    targetChainId != null &&
    chainId !== targetChainId;

  const [nameStr, setNameStr] = useState("");
  const [symbolStr, setSymbolStr] = useState("");
  const [supplyStr, setSupplyStr] = useState("");
  const [seedStr, setSeedStr] = useState("");
  const [deployErrors, setDeployErrors] = useState<DeployFieldError[]>([]);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const handledSuccessTxRef = useRef<`0x${string}` | null>(null);

  const parsedSupply = useMemo(
    () => parsePositiveDecimal18(supplyStr),
    [supplyStr]
  );
  const parsedSeed = useMemo(() => parsePositiveDecimal18(seedStr), [seedStr]);

  const priceDisplay = useMemo(() => {
    if (parsedSupply == null || parsedSeed == null) return null;
    const scaled = (parsedSeed * PRICE_QUOTIENT_SCALE) / parsedSupply;
    return trimDecimalZeros(formatUnits(scaled, 36));
  }, [parsedSupply, parsedSeed]);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: targetChainId ?? undefined,
  });

  useEffect(() => {
    if (!writeError) return;
    toast.error(t("ercs20.createFailed"), {
      description: writeError.message.slice(0, 200),
    });
  }, [writeError, t]);

  useEffect(() => {
    if (!isSuccess || !receipt || !txHash || factory == null) return;
    if (handledSuccessTxRef.current === txHash) return;
    handledSuccessTxRef.current = txHash;

    try {
      const { tokenAddress, index } = getErcs20CreateFromReceipt(
        receipt,
        factory
      );
      setDeployResult({ txHash, tokenAddress, index });
    } catch {
      setDeployResult({ txHash, parseFailed: true });
    }

    setNameStr("");
    setSymbolStr("");
    setSupplyStr("");
    setSeedStr("");
    setDeployErrors([]);
    resetWrite();
  }, [isSuccess, receipt, txHash, factory, resetWrite]);

  useEffect(() => {
    if (!isConnected || !address) return;
    setDeployErrors((prev) => prev.filter((e) => e !== "wallet"));
  }, [isConnected, address]);

  const busy = isWritePending || isConfirming;

  const handleCreate = useCallback(() => {
    if (
      factory == null ||
      targetChainId == null ||
      parsedSupply == null ||
      parsedSeed == null ||
      address == null
    ) {
      return;
    }
    const nm = nameStr.trim();
    const sym = symbolStr.trim();
    if (!nm || !sym) return;

    writeContract({
      address: factory,
      abi: ercs20FactoryAbi,
      functionName: "create",
      args: [nm, sym, parsedSupply, parsedSeed, address],
      chainId: targetChainId,
    });
  }, [
    factory,
    targetChainId,
    parsedSupply,
    parsedSeed,
    address,
    nameStr,
    symbolStr,
    writeContract,
  ]);

  const handleDeployClick = useCallback(() => {
    if (busy) return;

    const next: DeployFieldError[] = [];
    if (!nameStr.trim()) next.push("name");
    if (!symbolStr.trim()) next.push("symbol");
    if (parsedSupply == null) next.push("supply");
    if (parsedSeed == null) next.push("seed");
    if (!isConnected || address == null) next.push("wallet");

    if (next.length > 0) {
      setDeployErrors(next);
      return;
    }

    if (wrongNetwork) {
      reopenWrongNetwork();
      return;
    }

    setDeployErrors([]);
    handleCreate();
  }, [
    busy,
    isConnected,
    address,
    wrongNetwork,
    reopenWrongNetwork,
    nameStr,
    symbolStr,
    parsedSupply,
    parsedSeed,
    handleCreate,
  ]);

  if (!configured) {
    return (
      <PageShell className="flex justify-center py-8 sm:py-12">
        <div className="w-full max-w-lg">
          <p className="text-muted-foreground text-center text-sm">
            {t("swap.envNotConfigured")}
          </p>
        </div>
      </PageShell>
    );
  }

  if (deployResult != null) {
    const withToken = "tokenAddress" in deployResult;

    return (
      <PageShell className="flex justify-center py-8 sm:py-12">
        <div className="w-full max-w-lg">
        <div className="bg-muted/35 border-border/65 rounded-2xl border p-5 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className="text-primary bg-primary/12 mb-5 flex size-[4.5rem] shrink-0 items-center justify-center rounded-full ring-1 ring-primary/25"
              aria-hidden
            >
              <CheckCircle2Icon className="size-10" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t("ercs20.deploySuccessTitle")}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              {t("ercs20.deploySuccessSubtitle")}
            </p>
          </div>

          {withToken ? (
            <div className="mt-8 space-y-2">
              <Label htmlFor="fc-deployed-addr">
                {t("ercs20.tokenContractAddress")}
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  id="fc-deployed-addr"
                  readOnly
                  value={deployResult.tokenAddress}
                  className="h-12 rounded-2xl px-4 font-mono text-sm sm:flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 shrink-0 rounded-2xl sm:px-6"
                  onClick={() => {
                    if (!withToken) return;
                    const text = deployResult.tokenAddress;

                    if (!navigator.clipboard?.writeText) {
                      const ok = copyViaExecCommand(text);
                      if (ok) {
                        toast.success(t("ercs20.addressCopied"));
                      } else {
                        toast.error(t("ercs20.copyFailed"));
                      }
                      return;
                    }

                    void navigator.clipboard
                      .writeText(text)
                      .then(() => {
                        toast.success(t("ercs20.addressCopied"));
                      })
                      .catch(() => {
                        const ok = copyViaExecCommand(text);
                        if (ok) {
                          toast.success(t("ercs20.addressCopied"));
                        } else {
                          toast.error(t("ercs20.copyFailed"));
                        }
                      });
                  }}
                >
                  {t("ercs20.copyAddress")}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs tabular-nums">
                {t("ercs20.registryIndex")}:{" "}
                {deployResult.index.toString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-6 text-center text-sm">
              {t("ercs20.deployParseFailed")}
            </p>
          )}

          <p className="text-muted-foreground mt-6 break-all font-mono text-[11px] leading-relaxed">
            <span className="text-foreground/80 font-sans">
              {t("ercs20.txHashLabel")}:{" "}
            </span>
            {deployResult.txHash}
          </p>

          <Button
            type="button"
            className={cn(
              "mt-8 h-12 w-full rounded-2xl border-0 text-base font-semibold shadow-md"
            )}
            onClick={() => {
              setDeployResult(null);
              handledSuccessTxRef.current = null;
            }}
          >
            {t("ercs20.deployAnother")}
          </Button>
        </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex justify-center py-8 sm:py-12">
      <div className="w-full max-w-lg">
      <div className="bg-muted/35 border-border/65 rounded-2xl border p-5 shadow-sm transition-[box-shadow,transform] duration-300 ease-out hover:shadow-md sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("ercs20.title")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("ercs20.subtitle")}
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fc-name">{t("ercs20.name")}</Label>
            <Input
              id="fc-name"
              placeholder="Example Corp"
              value={nameStr}
              aria-invalid={deployErrors.includes("name")}
              onChange={(e) => {
                setNameStr(e.target.value);
                setDeployErrors((prev) => prev.filter((err) => err !== "name"));
              }}
              className={cn(
                ercs20FieldInputClass,
                deployErrors.includes("name") && "border-destructive"
              )}
            />
            {deployErrors.includes("name") ? (
              <InlineFieldError>{t("ercs20.toastNeedNameDesc")}</InlineFieldError>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-symbol">{t("ercs20.symbol")}</Label>
            <Input
              id="fc-symbol"
              placeholder="EXMPL"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={symbolStr}
              aria-invalid={deployErrors.includes("symbol")}
              onChange={(e) => {
                setSymbolStr(e.target.value.toUpperCase());
                setDeployErrors((prev) => prev.filter((err) => err !== "symbol"));
              }}
              className={cn(
                ercs20FieldInputClass,
                deployErrors.includes("symbol") && "border-destructive"
              )}
            />
            {deployErrors.includes("symbol") ? (
              <InlineFieldError>{t("ercs20.toastNeedSymbolDesc")}</InlineFieldError>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-supply">{t("ercs20.totalSupply")}</Label>
            <Input
              id="fc-supply"
              placeholder="100000000"
              inputMode="decimal"
              value={supplyStr}
              aria-invalid={deployErrors.includes("supply")}
              onChange={(e) => {
                setSupplyStr(sanitizeDecimal18(e.target.value));
                setDeployErrors((prev) => prev.filter((err) => err !== "supply"));
              }}
              className={cn(
                ercs20FieldInputClass,
                deployErrors.includes("supply") && "border-destructive"
              )}
            />
            {deployErrors.includes("supply") ? (
              <InlineFieldError>{t("ercs20.toastNeedSupplyDesc")}</InlineFieldError>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-seed">{t("ercs20.seedQuote")}</Label>
            <Input
              id="fc-seed"
              placeholder="100000"
              inputMode="decimal"
              value={seedStr}
              aria-invalid={deployErrors.includes("seed")}
              onChange={(e) => {
                setSeedStr(sanitizeDecimal18(e.target.value));
                setDeployErrors((prev) => prev.filter((err) => err !== "seed"));
              }}
              className={cn(
                ercs20FieldInputClass,
                deployErrors.includes("seed") && "border-destructive"
              )}
            />
            {deployErrors.includes("seed") ? (
              <InlineFieldError>{t("ercs20.toastNeedSeedDesc")}</InlineFieldError>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-price">{t("ercs20.price")}</Label>
            <Input
              id="fc-price"
              readOnly
              value={priceDisplay ?? ""}
              placeholder={t("ercs20.pricePlaceholder")}
              className={cn(
                ercs20FieldInputClass,
                "text-muted-foreground tabular-nums"
              )}
              aria-live="polite"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-owner">{t("ercs20.ownerAddress")}</Label>
            <Input
              id="fc-owner"
              readOnly
              value={isConnected && address ? address : ""}
              placeholder={t("ercs20.ownerConnectWallet")}
              aria-invalid={deployErrors.includes("wallet")}
              className={cn(
                ercs20FieldInputClass,
                isConnected && address
                  ? "font-mono text-sm sm:text-base"
                  : "text-muted-foreground",
                deployErrors.includes("wallet") && "border-destructive"
              )}
            />
            {deployErrors.includes("wallet") ? (
              <InlineFieldError>{t("ercs20.toastNeedWalletDesc")}</InlineFieldError>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          disabled={busy}
          className={cn(
            "mt-8 h-12 w-full rounded-2xl border-0 text-base font-semibold shadow-md",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:!bg-[var(--primary)] disabled:!text-[var(--primary-foreground)] disabled:!opacity-100 disabled:brightness-[0.88] disabled:saturate-[0.92] disabled:shadow-none"
          )}
          onClick={handleDeployClick}
        >
          {busy
            ? isConfirming
              ? t("swap.confirming")
              : t("swap.confirmWallet")
            : t("ercs20.submit")}
        </Button>

        <p className="text-muted-foreground mt-3 text-center text-xs">
          {t("ercs20.hint")}
        </p>
      </div>
      </div>
    </PageShell>
  );
}
