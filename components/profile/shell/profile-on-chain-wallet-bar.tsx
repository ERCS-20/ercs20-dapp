"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CopyIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useBalance, useChainId, useDisconnect, useReadContract } from "wagmi";

import { Button } from "@/components/ui/button";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import { erc20Abi } from "@/lib/contracts/abis";
import { shortTokenAddress } from "@/lib/utils/format/address";
import defaultTokenList from "@/lib/tokens/ercs20-default-list.json";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { supportedChains } from "@/lib/web3/chains";
import { useI18n } from "@/providers/i18n-provider";

const obxTokenMeta = (
  defaultTokenList as { address: string; symbol: string; name: string }[]
).find((t) => t.symbol === "OBX");

const obxTokenAddress = obxTokenMeta?.address as `0x${string}` | undefined;

function TokenIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border/60 sm:size-11"
        aria-hidden
      >
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={44}
      height={44}
      className="size-10 shrink-0 rounded-full ring-1 ring-border/60 sm:size-11"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function TokenBalanceBlock({
  name,
  symbol,
  amount,
}: {
  name: string;
  symbol: string;
  amount: string;
}) {
  const amountLabel = amount === "—" ? amount : `${amount} ${symbol}`;

  return (
    <div className="flex shrink-0 items-center gap-3">
      <TokenIcon symbol={symbol} />
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{name}</p>
        <p className="text-muted-foreground tabular-nums text-xs sm:text-sm">{amountLabel}</p>
      </div>
    </div>
  );
}

export function ProfileOnChainWalletBar() {
  const { t } = useI18n();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const { disconnect } = useDisconnect({
    mutation: {
      onSuccess: () => {
        router.push("/");
      },
    },
  });

  const chain = supportedChains.find((c) => c.id === chainId);

  const { data: nativeBal } = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address && isConnected) },
  });

  const { data: obxBal } = useTokenBalance({
    token: obxTokenAddress,
    address,
    chainId,
    query: { enabled: Boolean(address && isConnected && obxTokenAddress) },
  });

  const { data: obxDecimals } = useReadContract({
    address: obxTokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
    chainId,
    query: { enabled: Boolean(isConnected && obxTokenAddress) },
  });

  const nativeSymbol = nativeBal?.symbol ?? chain?.nativeCurrency.symbol ?? "—";
  const nativeName = chain?.nativeCurrency.name ?? nativeSymbol;
  const nativeAmount =
    nativeBal != null ? formatUnits(nativeBal.value, nativeBal.decimals) : "—";
  const obxName = obxTokenMeta?.name ?? "OBX";
  const obxAmount =
    obxBal != null ? formatUnits(obxBal, Number(obxDecimals ?? 18)) : "—";

  const explorerBase = chain?.blockExplorers?.default?.url;
  const explorerUrl =
    address && explorerBase ? `${explorerBase.replace(/\/$/, "")}/address/${address}` : null;

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success(t("wallet.addressCopied"));
    } catch {
      toast.error(t("wallet.copyFailed"));
    }
  }, [address, t]);

  return (
    <section className="border-border/60 bg-card shrink-0 border-b px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
      {!isConnected || !address ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{t("profile.notConnected")}</p>
          <ConnectButton.Custom>
            {({ openConnectModal, mounted, authenticationStatus }) => {
              const ready = mounted && authenticationStatus !== "loading";
              return (
                <Button
                  type="button"
                  disabled={!ready}
                  size="sm"
                  className="h-9 rounded-xl px-4"
                  onClick={openConnectModal}
                >
                  {t("wallet.connect")}
                </Button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
          <div className="justify-self-start">
            <TokenBalanceBlock name={obxName} symbol="OBX" amount={obxAmount} />
          </div>

          <div className="justify-self-center">
            <TokenBalanceBlock
              name={nativeName}
              symbol={nativeSymbol}
              amount={nativeAmount}
            />
          </div>

          <div className="flex min-w-0 flex-col items-end gap-1.5 justify-self-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() => disconnect()}
            >
              <LogOutIcon className="size-4" aria-hidden />
              {t("profile.disconnect")}
            </Button>
            <div className="flex min-w-0 max-w-full items-center justify-end gap-1">
              <code
                className="text-muted-foreground font-mono text-xs sm:text-sm"
                title={address}
              >
                {shortTokenAddress(address)}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0"
                aria-label={t("profile.copyAddress")}
                onClick={() => void copyAddress()}
              >
                <CopyIcon className="size-3.5" aria-hidden />
              </Button>
              {explorerUrl && (
                <Button variant="ghost" size="icon-sm" className="size-7 shrink-0" asChild>
                  <Link
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("profile.viewOnExplorer")}
                  >
                    <ExternalLinkIcon className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
