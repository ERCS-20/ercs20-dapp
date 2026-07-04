import type { DepositRsp } from "@/services/asset/types";

/** Phase 2 mock — replace with `services/asset` API when wired. */
export function getMockDeposits(): DepositRsp[] {
  return [
    {
      tokenAddress: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
      symbol: "OBX",
      amount: "500000000000000000000",
      txHash:
        "0x8f3c2a1b9e4d7c6f5a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0",
      fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      toAddress: "0x0000000000000000000000000000000000000001",
      status: "Success",
      confirmedAt: "2026-07-04T08:15:22.000Z",
      createdAt: "2026-07-04T08:14:01.000Z",
      updatedAt: "2026-07-04T08:15:22.000Z",
    },
    {
      tokenAddress: "0x0000000000000000000000000000000000000000",
      symbol: "USDC",
      amount: "100000000000000000000",
      txHash:
        "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      toAddress: "0x0000000000000000000000000000000000000001",
      status: "Pending",
      confirmedAt: null,
      createdAt: "2026-07-04T10:02:11.000Z",
      updatedAt: "2026-07-04T10:02:11.000Z",
    },
  ];
}
