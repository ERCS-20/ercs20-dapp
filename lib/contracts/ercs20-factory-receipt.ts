import type { TransactionReceipt } from "viem";
import { decodeEventLog } from "viem";

import { ercs20FactoryAbi } from "@/lib/contracts/ercs20-factory-abi";

/**
 * Reads `Create` from factory tx receipt (ERCS20Factory emits `Create`, not Uniswap `PairCreated`).
 * Optionally restricts logs to `factoryAddress` to avoid decoding unrelated contracts.
 */
export function getErcs20CreateFromReceipt(
  receipt: TransactionReceipt,
  factoryAddress?: `0x${string}`
): { tokenAddress: `0x${string}`; index: bigint } {
  const factoryLc = factoryAddress?.toLowerCase();

  for (const log of receipt.logs) {
    if (
      factoryLc != null &&
      typeof log.address === "string" &&
      log.address.toLowerCase() !== factoryLc
    ) {
      continue;
    }
    try {
      const decoded = decodeEventLog({
        abi: ercs20FactoryAbi,
        data: log.data,
        topics: log.topics,
        strict: false,
      });
      if (decoded.eventName !== "Create") continue;
      const args = decoded.args as {
        ercs20: `0x${string}`;
        index: bigint;
      };
      return { tokenAddress: args.ercs20, index: args.index };
    } catch {
      /* not Create */
    }
  }
  throw new Error("Create log not found");
}
