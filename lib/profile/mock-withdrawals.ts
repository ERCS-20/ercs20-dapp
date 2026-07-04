import type { WithdrawalRsp } from "@/services/asset/types";

/** Phase 2 mock — replace with `services/asset` API when wired. */
export function getMockWithdrawals(): WithdrawalRsp[] {
  return [
    {
      tokenAddress: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
      symbol: "OBX",
      amount: "120000000000000000000",
      fromAddress: "0x0000000000000000000000000000000000000001",
      toAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      status: "Success",
      txHash:
        "0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d",
      createdAt: "2026-07-03T14:20:00.000Z",
      updatedAt: "2026-07-03T14:22:45.000Z",
    },
    {
      tokenAddress: "0x0000000000000000000000000000000000000000",
      symbol: "USDC",
      amount: "25000000000000000000",
      fromAddress: "0x0000000000000000000000000000000000000001",
      toAddress: null,
      status: "AwaitingClaim",
      txHash: null,
      createdAt: "2026-07-04T09:30:00.000Z",
      updatedAt: "2026-07-04T09:30:00.000Z",
    },
  ];
}
