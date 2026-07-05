"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadIcon } from "lucide-react";
import { formatUnits } from "viem";
import { toast } from "sonner";

import {
  ProfileTransferAddressBlock,
} from "@/components/profile/shared/profile-transfer-dialog-parts";
import { ProfileFormHeader } from "@/components/profile/shared/profile-form-header";
import { ProfileBackLink } from "@/components/profile/shared/profile-back-link";
import { ProfileShell, profileDetailSectionClass, type ProfileSection } from "@/components/profile/shell/profile-shell";
import { ProfileTokenSelectSheet } from "@/components/profile/shared/profile-token-select-sheet";
import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/use-wallet";
import { formatBalance } from "@/lib/utils/format/balance";
import { getMockUserBalanceByTokenAddress } from "@/lib/profile/mock-user-balances";
import { resolveInitialProfileToken } from "@/lib/profile/resolve-initial-token";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
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

function parseAvailableBalance(raw: string, decimals: number): number {
  try {
    const v = Number(formatUnits(BigInt(raw), decimals));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

export function ProfileWithdrawView() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useWallet();

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

  const spotBalance = useMemo(
    () =>
      selectedToken
        ? getMockUserBalanceByTokenAddress(selectedToken.contract)
        : undefined,
    [selectedToken]
  );

  const tokenDecimals = selectedToken?.decimals ?? 18;

  const availableAmount = spotBalance
    ? parseAvailableBalance(spotBalance.availableBalance, tokenDecimals)
    : 0;

  const canUseSizePct = isConnected && availableAmount > 0;

  const applyWithdrawPercent = useCallback(
    (pct: number) => {
      if (pct < 1 || pct > 100 || availableAmount <= 0) return;
      const part = availableAmount * (pct / 100);
      setAmount(String(part).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1"));
    },
    [availableAmount]
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

  function handleConfirm() {
    if (!selectedToken) return;
    const trimmed = amount.trim();
    const n = Number(trimmed);
    if (!trimmed || !Number.isFinite(n) || n <= 0) {
      toast.error(t("profile.invalidAmount"));
      return;
    }
    if (!address) {
      toast.error(t("profile.notConnected"));
      return;
    }
    toast.success(t("profile.withdrawSubmitted").replace("{symbol}", selectedToken.symbol));
    router.push("/profile");
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
  }

  const displaySymbol = selectedToken?.symbol ?? "—";
  const balanceLabel = spotBalance
    ? formatBalance(spotBalance.availableBalance)
    : "—";

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
          <div className="rounded-[28px] bg-brand-alt/10 p-1 shadow-lg ring-1 ring-brand-alt/20">
            <div className="rounded-[24px] bg-card p-5 sm:p-6">
              <ProfileFormHeader
                tone="brand-alt"
                icon={<UploadIcon aria-hidden />}
                title={t("profile.withdraw")}
                description={t("profile.withdrawDialogDesc")}
              />

              <div className="space-y-4">
                <div className="bg-brand-alt/5 border-brand-alt/20 space-y-1.5 rounded-2xl border p-3.5 sm:p-4">
                  <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
                    <span>{t("profile.amount")}</span>
                    <span>
                      {t("profile.availableBalance")}: {balanceLabel}
                      {selectedToken ? ` ${selectedToken.symbol}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input
                      id="withdraw-amount"
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
                      placeholder={isConnected ? t("profile.amountPlaceholder") : "—"}
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
                    side="sell"
                    onPctChange={(pct) => {
                      setSizePct(pct);
                      applyWithdrawPercent(pct);
                    }}
                  />
                </div>

                {address ? (
                  <ProfileTransferAddressBlock
                    id="withdraw-address"
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
                onClick={handleConfirm}
                disabled={!address || !selectedToken}
              >
                {t("profile.confirmWithdraw")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ProfileShell>
  );
}
