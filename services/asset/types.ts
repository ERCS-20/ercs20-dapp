/** Mirrors `user_balances` row (fields exposed to UI). */
export type UserBalanceStatus = "Active" | "Frozen" | "Disabled";

export type UserBalanceRsp = {
  tokenAddress: string;
  symbol: string;
  name: string;
  /** decimal(63,0) as string */
  availableBalance: string;
  /** decimal(63,0) as string */
  frozenBalance: string;
  status: UserBalanceStatus;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `deposits` row (fields exposed to UI). */
export type DepositStatus = "Pending" | "Success";

export type DepositRsp = {
  tokenAddress: string;
  symbol: string;
  /** decimal(63,0) as string */
  amount: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  status: DepositStatus;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `withdrawals` row (fields exposed to UI). */
export type WithdrawalStatus = "AwaitingClaim" | "Success";

export type WithdrawalRsp = {
  tokenAddress: string;
  symbol: string;
  /** decimal(63,0) as string */
  amount: string;
  fromAddress: string;
  toAddress: string | null;
  status: WithdrawalStatus;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `account_ledger` row (fields exposed to UI). */
export type AccountLedgerBizType = "Deposit" | "Withdraw" | "Order";

export type AccountLedgerBizSubType =
  | "Deposit"
  | "WithdrawFrozen"
  | "WithdrawUnfrozen"
  | "OrderFrozen"
  | "OrderUnfrozen"
  | "OrderDeduct"
  | "OrderCredit"
  | "OrderFee";

export type AccountLedgerRsp = {
  tokenAddress: string;
  /** decimal(63,0) as string — may be negative */
  deltaAvailable: string;
  /** decimal(63,0) as string — may be negative */
  deltaFrozen: string;
  bizType: AccountLedgerBizType;
  bizSubType: AccountLedgerBizSubType;
  refId: string;
  remark: string | null;
  createdAt: string;
};
