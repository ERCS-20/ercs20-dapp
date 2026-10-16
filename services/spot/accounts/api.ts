import { getAuthSession } from "@/lib/auth/session";
import { request } from "@/lib/api/request";
import {
  loadSpotUserBalancesIdStorage,
  saveSpotUserBalancesIdStorage,
} from "@/lib/storage/local-storage";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotAccountsApi } from "@/services/spot/accounts/paths";
import type {
  AccountLedgerPaginationReq,
  AccountLedgerPaginationRsp,
  DepositsPaginationReq,
  DepositsPaginationRsp,
  UserBalancesReq,
  UserBalancesRsp,
  WithdrawalsDetailReq,
  WithdrawalsPaginationReq,
  WithdrawalsPaginationRsp,
  WithdrawalsRsp,
} from "@/services/spot/accounts/types";

/** POST /users/user-balances/balance — `userId` from gateway JWT headers. */
export function getUserBalance(req: UserBalancesReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for balance query"));
  }
  return request.post<UserBalancesRsp>(SpotAccountsApi.userBalance, {
    tokenAddress: tokenAddress.toLowerCase(),
  });
}

/** POST /users/user-balances/list — `userId` from gateway JWT headers. */
export function listUserBalances() {
  return request.post<UserBalancesRsp[]>(SpotAccountsApi.userBalancesList);
}

const UNLOADED = Symbol("unloaded");
const idByToken = new Map<string, number>();
let loadedUserId: string | null | typeof UNLOADED = UNLOADED;
let listInflight: Promise<void> | null = null;

function seedUserBalancesIds(rows: UserBalancesRsp[]): void {
  const userId = getAuthSession()?.userId ?? null;
  if (loadedUserId !== userId) {
    idByToken.clear();
    loadedUserId = userId;
    for (const [token, id] of Object.entries(loadSpotUserBalancesIdStorage(userId))) {
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
    saveSpotUserBalancesIdStorage(userId, payload);
  }
}

function ensureUserBalancesIdsLoaded(): void {
  const userId = getAuthSession()?.userId ?? null;
  if (loadedUserId === userId) return;
  idByToken.clear();
  loadedUserId = userId;
  for (const [token, id] of Object.entries(loadSpotUserBalancesIdStorage(userId))) {
    idByToken.set(token, id);
  }
}

/**
 * Resolve ledger `userBalancesId` for a token.
 * Uses localStorage + in-memory map; calls {@link listUserBalances} only on miss.
 */
export async function resolveSpotUserBalancesId(tokenAddress: string): Promise<number> {
  const token = tokenAddress.trim().toLowerCase();
  if (!token) {
    throw new Error("Missing token address for user balances id lookup");
  }

  ensureUserBalancesIdsLoaded();
  const cached = idByToken.get(token);
  if (cached != null) return cached;

  if (!listInflight) {
    listInflight = listUserBalances()
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

/** POST /users/deposits/pagination — `userId` from gateway JWT headers. */
export function paginationDeposits(req: DepositsPaginationReq) {
  return request.post<DepositsPaginationRsp>(SpotAccountsApi.depositsPagination, req);
}

/** POST /users/withdrawals/pagination — `userId` from gateway JWT headers. */
export function paginationWithdrawals(req: WithdrawalsPaginationReq) {
  return request.post<WithdrawalsPaginationRsp>(SpotAccountsApi.withdrawalsPagination, req);
}

/** POST /users/withdrawals/detail — `userId` from gateway JWT headers. */
export function getWithdrawalDetail(req: WithdrawalsDetailReq) {
  return request.post<WithdrawalsRsp>(SpotAccountsApi.withdrawalsDetail, req);
}

/** POST /users/accountLedger/pagination — `userId` from gateway JWT headers. */
export function paginationAccountLedger(req: AccountLedgerPaginationReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.condition?.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for account ledger query"));
  }

  return request.post<AccountLedgerPaginationRsp>(SpotAccountsApi.accountLedgerPagination, {
    ...req,
    condition: {
      ...req.condition,
      tokenAddress: tokenAddress.toLowerCase(),
      ...(req.condition?.bizType ? { bizType: req.condition.bizType } : {}),
      ...(req.condition?.bizSubType ? { bizSubType: req.condition.bizSubType } : {}),
    },
  });
}
