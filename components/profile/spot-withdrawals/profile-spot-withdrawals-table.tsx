"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";

import { ProfilePaginatedTableSection } from "@/components/profile/shared/profile-paginated-table-section";
import { buttonVariants } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWallet } from "@/hooks/use-wallet";
import { ApiNetworkError, ApiRequestError, getApiErrorMessage } from "@/lib/api/errors";
import { getWalletErrorMessage } from "@/lib/web3/contract-errors";
import { getAssetVaultAddress, isAssetVaultConfigured } from "@/lib/config/asset-vault";
import { getSwapTargetChainId } from "@/lib/config/swap-target";
import { executeGlobalSpotVaultWithdraw } from "@/lib/contracts/global-spot-vault";
import { formatBalance } from "@/lib/utils/format/balance";
import { parseApiBigInt, apiBigIntToString } from "@/lib/utils/coerce-bigint";
import { shortTokenAddress, shortTxHash } from "@/lib/utils/format/address";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { profileTableFilterSelectClass } from "@/lib/profile/table-filters";
import { useProfilePagination } from "@/lib/profile/use-profile-pagination";
import {
  withdrawalStatusBadgeClass,
  withdrawalStatusLabel,
} from "@/lib/profile/transfer-status";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { WithdrawalStatus } from "@/services/asset/types";
import { getWithdrawalDetail } from "@/services/spot/accounts/api";
import { useUserBalancesList, useWithdrawalsPagination } from "@/services/spot/accounts/hooks";
import type { WithdrawalsRsp } from "@/services/spot/accounts/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const WITHDRAWAL_STATUSES: WithdrawalStatus[] = ["AwaitingClaim", "Success"];

type SymbolFilter = string | "all";
type WithdrawalStatusFilter = WithdrawalStatus | "all";

function normalizeHexBytes(value: string): `0x${string}` {
  const trimmed = value.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

function TokenIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-border/60"
        aria-hidden
      >
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-border/60"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function WithdrawalClaimButton({
  row,
  onSuccess,
}: {
  row: WithdrawalsRsp;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const targetChainId = getSwapTargetChainId();
  const vaultAddress = getAssetVaultAddress();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  if (row.status !== "AwaitingClaim") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const walletMatches =
    Boolean(address) &&
    address!.toLowerCase() === row.fromAddress?.trim().toLowerCase();
  const wrongNetwork =
    targetChainId != null && chainId != null && chainId !== targetChainId;
  const isClaiming = isPending || isFetchingDetail;
  const canClaim =
    isConnected &&
    walletMatches &&
    !wrongNetwork &&
    isAssetVaultConfigured() &&
    !isClaiming;

  async function handleClaim() {
    if (!address) {
      toast.error(t("profile.notConnected"));
      return;
    }
    if (!walletMatches) {
      toast.error(t("profile.claimWrongWallet"));
      return;
    }
    if (wrongNetwork) {
      toast.error(t("swap.wrongNetwork"));
      return;
    }
    if (!vaultAddress || targetChainId == null || !publicClient) {
      toast.error(t("profile.depositVaultNotConfigured"));
      return;
    }

    setIsFetchingDetail(true);
    try {
      const detail = await getWithdrawalDetail({ id: row.id });
      const orderId = parseApiBigInt(detail.salt);
      const amount = parseApiBigInt(detail.amount);
      const tokenAddress = detail.tokenAddress?.trim();
      const sysSignature = detail.sysSignature?.trim();

      if (orderId == null || amount == null || !tokenAddress || !sysSignature) {
        toast.error(t("profile.claimFailed"));
        return;
      }

      const hash = await executeGlobalSpotVaultWithdraw({
        publicClient,
        account: address,
        writeContractAsync,
        vaultAddress,
        orderId,
        tokenAddress: tokenAddress.toLowerCase() as `0x${string}`,
        amount,
        signature: normalizeHexBytes(sysSignature),
        chainId: targetChainId,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") {
        toast.error(t("profile.claimReverted"));
        return;
      }
      toast.success(t("profile.claimSubmitted"));
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiRequestError || error instanceof ApiNetworkError
          ? getApiErrorMessage(error, t("profile.claimFailed"))
          : getWalletErrorMessage(error, t("profile.claimFailed"), {
              userRejected: t("wallet.userRejected"),
              revertMessages: {
                WithdrawOrderAlreadyUsed: t("profile.claimAlreadyUsed"),
                InsufficientBalance: t("profile.claimInsufficientVaultBalance"),
                NotWithdrawDAO: t("profile.claimInvalidSignature"),
              },
            });
      toast.error(message);
    } finally {
      setIsFetchingDetail(false);
    }
  }

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "inline-flex h-8 rounded-lg px-2.5 text-xs",
        !canClaim && "pointer-events-auto opacity-50"
      )}
      disabled={!canClaim}
      onClick={() => void handleClaim()}
    >
      {t("profile.claim")}
    </button>
  );
}

function WithdrawalRow({
  row,
  onClaimSuccess,
}: {
  row: WithdrawalsRsp;
  onClaimSuccess: () => void;
}) {
  const { t } = useI18n();
  const status = row.status as WithdrawalStatus;

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-center gap-2.5">
          <TokenIcon symbol={row.symbol} />
          <div className="min-w-0">
            <p className="text-foreground truncate font-medium">{row.symbol}</p>
            <p
              className="text-muted-foreground mt-0.5 truncate font-mono text-xs"
              title={row.tokenAddress}
            >
              {shortTokenAddress(row.tokenAddress)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-brand-alt tabular-nums">
        {formatBalance(apiBigIntToString(row.amount))} {row.symbol}
      </TableCell>
      <TableCell>
        {row.fromAddress?.trim() ? (
          <span className="font-mono text-xs" title={row.fromAddress}>
            {shortTokenAddress(row.fromAddress)}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        {row.toAddress?.trim() ? (
          <span className="font-mono text-xs" title={row.toAddress}>
            {shortTokenAddress(row.toAddress)}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            withdrawalStatusBadgeClass(status)
          )}
        >
          {withdrawalStatusLabel(t, status)}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatUtcDateTime(row.createdAt)}
      </TableCell>
      <TableCell>
        {row.txHash?.trim() ? (
          <span className="font-mono text-xs" title={row.txHash}>
            {shortTxHash(row.txHash)}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        <WithdrawalClaimButton row={row} onSuccess={onClaimSuccess} />
      </TableCell>
    </TableRow>
  );
}

export function ProfileSpotWithdrawalsTable() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [symbolFilter, setSymbolFilter] = useState<SymbolFilter>("all");
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatusFilter>("all");
  const pagination = useProfilePagination();

  const { data: balancesList } = useUserBalancesList({ enabled: isAuthenticated });

  const symbolOptions = useMemo(() => {
    const balances = balancesList ?? [];
    return [...new Set(balances.map((balance) => balance.symbol))].sort();
  }, [balancesList]);

  const paginationReq = useMemo(
    () => ({
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      condition: {
        ...(symbolFilter !== "all" ? { symbol: symbolFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
    }),
    [pagination.currentPage, pagination.pageSize, symbolFilter, statusFilter]
  );

  const { data, isLoading, isFetching } = useWithdrawalsPagination(paginationReq, {
    enabled: isAuthenticated,
  });

  const rows = data?.pageItems ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasFilters = symbolFilter !== "all" || statusFilter !== "all";
  const showFilters =
    isAuthenticated && (symbolOptions.length > 0 || totalCount > 0 || hasFilters);

  function handleSymbolFilterChange(value: string) {
    setSymbolFilter(value);
    pagination.resetPage();
  }

  function handleStatusFilterChange(value: WithdrawalStatusFilter) {
    setStatusFilter(value);
    pagination.resetPage();
  }

  function handleClaimSuccess() {
    void queryClient.invalidateQueries({ queryKey: ["spot", "accounts", "withdrawals"] });
    void queryClient.invalidateQueries({ queryKey: ["spot", "accounts"] });
  }

  return (
    <ProfilePaginatedTableSection
      title={t("profile.spotWithdrawHistory")}
      showFilters={showFilters}
      isLoading={isLoading}
      totalCount={totalCount}
      hasRows={rows.length > 0}
      hasFilters={hasFilters}
      emptyMessage={t("profile.spotWithdrawHistoryEmpty")}
      footerColSpan={8}
      pageJumpId="withdrawal-page-jump"
      footerProps={pagination.buildFooterProps({
        totalPage: data?.totalPage ?? 0,
        totalCount,
        isFetching,
      })}
      filters={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 text-xs">{t("profile.symbol")}</span>
            <select
              className={profileTableFilterSelectClass}
              value={symbolFilter}
              onChange={(e) => handleSymbolFilterChange(e.target.value)}
              aria-label={t("profile.symbol")}
            >
              <option value="all">{t("profile.ledgerFilterAll")}</option>
              {symbolOptions.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 text-xs">
              {t("profile.balanceStatus")}
            </span>
            <select
              className={profileTableFilterSelectClass}
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as WithdrawalStatusFilter)}
              aria-label={t("profile.balanceStatus")}
            >
              <option value="all">{t("profile.ledgerFilterAll")}</option>
              {WITHDRAWAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {withdrawalStatusLabel(t, status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      header={
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs">{t("profile.asset")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.amount")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.fromAddress")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.toAddress")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.balanceStatus")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.createdAt")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("profile.txHash")}</TableHead>
            <TableHead className="text-muted-foreground w-[6rem] text-xs">{t("profile.actions")}</TableHead>
          </TableRow>
        </TableHeader>
      }
    >
      <TableBody>
        {rows.map((row) => (
          <WithdrawalRow
            key={row.id}
            row={row}
            onClaimSuccess={handleClaimSuccess}
          />
        ))}
      </TableBody>
    </ProfilePaginatedTableSection>
  );
}
