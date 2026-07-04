import type { UserBalanceRsp } from "@/services/asset/types";

/** Phase 2 mock — replace with `services/asset` API when wired. */
export function getMockUserBalances(): UserBalanceRsp[] {
  const now = "2026-07-04T10:30:00.000Z";
  return [
    {
      tokenAddress: "0x0000000000000000000000000000000000000000",
      symbol: "USDC",
      name: "USD Coin",
      availableBalance: "1250000000000000000000",
      frozenBalance: "50000000000000000000",
      status: "Active",
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: now,
    },
    {
      tokenAddress: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
      symbol: "OBX",
      name: "Orbix DAO",
      availableBalance: "850000000000000000000",
      frozenBalance: "12000000000000000000",
      status: "Active",
      createdAt: "2026-06-15T12:20:00.000Z",
      updatedAt: now,
    },
    {
      tokenAddress: "0xb2c3d4e5f6789012345678901234567890abcd",
      symbol: "DEMO",
      name: "Demo Token",
      availableBalance: "0",
      frozenBalance: "1000000000000000000",
      status: "Frozen",
      createdAt: "2026-05-20T06:00:00.000Z",
      updatedAt: "2026-07-01T09:15:00.000Z",
    },
  ];
}

export function getMockUserBalanceByTokenAddress(
  tokenAddress: string
): UserBalanceRsp | undefined {
  const key = tokenAddress.toLowerCase();
  return getMockUserBalances().find((b) => b.tokenAddress.toLowerCase() === key);
}
