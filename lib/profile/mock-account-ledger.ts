import type { AccountLedgerRsp } from "@/services/asset/types";

const obx = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";
const usdc = "0x0000000000000000000000000000000000000000";
const demo = "0xb2c3d4e5f6789012345678901234567890abcd";

const ledgerByToken: Record<string, AccountLedgerRsp[]> = {
  [usdc.toLowerCase()]: [
    {
      tokenAddress: usdc,
      deltaAvailable: "1250000000000000000000",
      deltaFrozen: "0",
      bizType: "Deposit",
      bizSubType: "Deposit",
      refId: "dep-1001",
      remark: null,
      createdAt: "2026-06-01T08:00:10.000Z",
    },
    {
      tokenAddress: usdc,
      deltaAvailable: "-50000000000000000000",
      deltaFrozen: "50000000000000000000",
      bizType: "Order",
      bizSubType: "OrderFrozen",
      refId: "ord-8821",
      remark: "OBX/USDC buy",
      createdAt: "2026-06-28T11:22:00.000Z",
    },
    {
      tokenAddress: usdc,
      deltaAvailable: "0",
      deltaFrozen: "-10000000000000000000",
      bizType: "Order",
      bizSubType: "OrderDeduct",
      refId: "trd-44102",
      remark: null,
      createdAt: "2026-07-02T09:15:33.000Z",
    },
  ],
  [obx.toLowerCase()]: [
    {
      tokenAddress: obx,
      deltaAvailable: "850000000000000000000",
      deltaFrozen: "0",
      bizType: "Deposit",
      bizSubType: "Deposit",
      refId: "dep-2008",
      remark: null,
      createdAt: "2026-06-15T12:20:05.000Z",
    },
    {
      tokenAddress: obx,
      deltaAvailable: "-12000000000000000000",
      deltaFrozen: "12000000000000000000",
      bizType: "Withdraw",
      bizSubType: "WithdrawFrozen",
      refId: "wdr-3301",
      remark: null,
      createdAt: "2026-07-01T16:40:00.000Z",
    },
    {
      tokenAddress: obx,
      deltaAvailable: "5000000000000000000",
      deltaFrozen: "0",
      bizType: "Order",
      bizSubType: "OrderCredit",
      refId: "trd-44102",
      remark: "Match credit",
      createdAt: "2026-07-02T09:15:33.000Z",
    },
  ],
  [demo.toLowerCase()]: [
    {
      tokenAddress: demo,
      deltaAvailable: "0",
      deltaFrozen: "1000000000000000000",
      bizType: "Order",
      bizSubType: "OrderFrozen",
      refId: "ord-9900",
      remark: "Demo pair",
      createdAt: "2026-05-20T06:00:15.000Z",
    },
  ],
};

/** Phase 2 mock — replace with `services/asset` API when wired. */
export function getMockAccountLedger(tokenAddress: string): AccountLedgerRsp[] {
  return ledgerByToken[tokenAddress.toLowerCase()] ?? [];
}
