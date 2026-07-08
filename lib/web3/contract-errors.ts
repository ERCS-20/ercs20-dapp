import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem";

/** Known GlobalSpotVault custom error selectors → names. */
const CUSTOM_ERROR_SELECTORS: Record<`0x${string}`, string> = {
  "0x3e831232": "NotWithdrawDAO",
  "0xf4d678b8": "InsufficientBalance",
  "0xdd5ac9b2": "WithdrawOrderAlreadyUsed",
};

export type WalletErrorKind = "user_rejected" | "contract_revert" | "other";

export type ParsedWalletError = {
  kind: WalletErrorKind;
  /** Custom error name from contract ABI, e.g. `InsufficientBalance`. */
  revertName?: string;
  message: string;
};

function extractRevertNameFromMessage(message: string): string | undefined {
  const selectorMatch = message.match(/custom error (0x[a-fA-F0-9]{8})/);
  if (selectorMatch?.[1]) {
    const name = CUSTOM_ERROR_SELECTORS[selectorMatch[1].toLowerCase() as `0x${string}`];
    if (name) return name;
  }
  const match = message.match(/\b([A-Z][A-Za-z0-9]*)\(\)/);
  return match?.[1];
}

function extractRevertName(error: unknown): string | undefined {
  if (!(error instanceof BaseError)) {
    if (error instanceof Error) {
      return extractRevertNameFromMessage(error.message);
    }
    return undefined;
  }

  const revert = error.walk(
    (err) => err instanceof ContractFunctionRevertedError
  );
  if (revert instanceof ContractFunctionRevertedError) {
    if (revert.data?.errorName) return revert.data.errorName;

    const reason = revert.reason?.trim();
    if (reason) return reason;

    const fromMsg = extractRevertNameFromMessage(revert.message);
    if (fromMsg) return fromMsg;
  }

  return extractRevertNameFromMessage(error.shortMessage || error.message);
}

/** Parse viem / wagmi wallet and contract errors into a stable shape. */
export function parseWalletError(error: unknown, fallback: string): ParsedWalletError {
  if (error instanceof UserRejectedRequestError) {
    return { kind: "user_rejected", message: fallback };
  }

  const revertName = extractRevertName(error);

  if (revertName) {
    return { kind: "contract_revert", revertName, message: revertName };
  }

  if (error instanceof BaseError) {
    return {
      kind: "other",
      message: error.shortMessage || error.message || fallback,
    };
  }

  if (error instanceof Error) {
    return { kind: "other", message: error.message || fallback };
  }

  return { kind: "other", message: fallback };
}

/** Map parsed wallet errors to a user-facing string. */
export function getWalletErrorMessage(
  error: unknown,
  fallback: string,
  options?: {
    userRejected?: string;
    revertMessages?: Record<string, string>;
  }
): string {
  const parsed = parseWalletError(error, fallback);

  if (parsed.kind === "user_rejected" && options?.userRejected) {
    return options.userRejected;
  }

  if (parsed.revertName && options?.revertMessages?.[parsed.revertName]) {
    return options.revertMessages[parsed.revertName]!;
  }

  if (parsed.kind === "contract_revert" && parsed.revertName) {
    return parsed.revertName;
  }

  return parsed.message || fallback;
}
