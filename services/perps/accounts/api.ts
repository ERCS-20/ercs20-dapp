import { getAuthSession } from "@/lib/auth/session";
import { request } from "@/lib/api/request";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import {
  loadPerpsUserBalancesIdStorage,
  savePerpsUserBalancesIdStorage,
} from "@/lib/storage/local-storage";
import { PerpsAccountsApi } from "@/services/perps/accounts/paths";
import type {
  PerpsAccountLedgerPaginationReq,
  PerpsAccountLedgerPaginationRsp,
  PerpsDepositsPaginationReq,
  PerpsDepositsPaginationRsp,
  PerpsUserBalancesReq,
  PerpsUserBalancesRsp,
  PerpsWithdrawalsDetailReq,
  PerpsWithdrawalsPaginationReq,
  PerpsWithdrawalsPaginationRsp,
  PerpsWithdrawalsRsp,
} from "@/services/perps/accounts/types";

/**
 * POST /perps/accounts/user-balances/balance — `userId` from gateway JWT headers.
 * Omit `tokenAddress` to query the configured native USDC ledger token.
 */
export function getPerpsUserBalance(req?: Partial<PerpsUserBalancesReq>) {
  const tokenAddress = (
    req?.tokenAddress?.trim() || getPerpsNativeTokenAddress()
  ).toLowerCase();
  return request.post<PerpsUserBalancesRsp>(PerpsAccountsApi.userBalance, {
    tokenAddress,
  });
}

/** POST /perps/accounts/user-balances/list — `userId` from gateway JWT headers. */
export function listPerpsUserBalances() {
  return request.post<PerpsUserBalancesRsp[]>(PerpsAccountsApi.userBalancesList);
}

const UNLOADED = Symbol("unloaded");
const idByToken = new Map<string, number>();
let loadedUserId: string | null | typeof UNLOADED = UNLOADED;
let listInflight: Promise<void> | null = null;

function seedUserBalancesIds(rows: PerpsUserBalancesRsp[]): void {
  const userId = getAuthSession()?.userId ?? null;
  if (loadedUserId !== userId) {
    idByToken.clear();
    loadedUserId = userId;
    for (const [token, id] of Object.entries(loadPerpsUserBalancesIdStorage(userId))) {
      idByToken.set(token, id);
    }
  }

  let changed = false;
  for (const row of rows) {
    const token = row.tokenAddress?.trim().toLowerCase();
    if (!token || !Number.isFinite(row.id) || row.id <= 0) continue;
    if (idByToken.get(token) === row.id) continue;
    idByToken.set(token, row.id);
    changed = true;
  }
  if (changed) {
    const payload: Record<string, number> = {};
    for (const [token, id] of idByToken) {
      payload[token] = id;
    }
    savePerpsUserBalancesIdStorage(userId, payload);
  }
}

function ensureUserBalancesIdsLoaded(): void {
  const userId = getAuthSession()?.userId ?? null;
  if (loadedUserId === userId) return;
  idByToken.clear();
  loadedUserId = userId;
  for (const [token, id] of Object.entries(loadPerpsUserBalancesIdStorage(userId))) {
    idByToken.set(token, id);
  }
}

/**
 * Resolve ledger `userBalancesId` for a token.
 * Uses localStorage + in-memory map; calls {@link listPerpsUserBalances} only on miss.
 */
export async function resolvePerpsUserBalancesId(tokenAddress: string): Promise<number> {
  const token = tokenAddress.trim().toLowerCase();
  if (!token) {
    throw new Error("Missing token address for user balances id lookup");
  }

  ensureUserBalancesIdsLoaded();
  const cached = idByToken.get(token);
  if (cached != null) return cached;

  if (!listInflight) {
    listInflight = listPerpsUserBalances()
      .then((rows) => {
        seedUserBalancesIds(rows);
      })
      .finally(() => {
        listInflight = null;
      });
  }
  await listInflight;

  const id = idByToken.get(token);
  if (id == null) {
    throw new Error(`User balance not found for token ${token}`);
  }
  return id;
}

/** POST /perps/accounts/deposits/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsDeposits(req: PerpsDepositsPaginationReq) {
  return request.post<PerpsDepositsPaginationRsp>(PerpsAccountsApi.depositsPagination, req);
}

/** POST /perps/accounts/withdrawals/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsWithdrawals(req: PerpsWithdrawalsPaginationReq) {
  return request.post<PerpsWithdrawalsPaginationRsp>(
    PerpsAccountsApi.withdrawalsPagination,
    req
  );
}

/** POST /perps/accounts/withdrawals/detail — `userId` from gateway JWT headers. */
export function getPerpsWithdrawalDetail(req: PerpsWithdrawalsDetailReq) {
  return request.post<PerpsWithdrawalsRsp>(PerpsAccountsApi.withdrawalsDetail, req);
}

/** POST /perps/accounts/accountLedger/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsAccountLedger(req: PerpsAccountLedgerPaginationReq) {
  const tokenAddress = req.condition?.tokenAddress?.trim().toLowerCase();
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for account ledger query"));
  }

  return request.post<PerpsAccountLedgerPaginationRsp>(PerpsAccountsApi.accountLedgerPagination, {
    ...req,
    condition: {
      ...req.condition,
      tokenAddress,
      ...(req.condition?.bizType ? { bizType: req.condition.bizType } : {}),
      ...(req.condition?.bizSubType ? { bizSubType: req.condition.bizSubType } : {}),
    },
  });
}
