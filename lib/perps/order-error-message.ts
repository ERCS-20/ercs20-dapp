import { ApiRequestError, getApiErrorMessage } from "@/lib/api/errors";

/** Backend `ErrorCode` → i18n key under `spot.*`. */
const PERPS_ERROR_CODE_I18N: Record<string, string> = {
  INSUFFICIENT_BALANCE: "perps.insufficientBalance",
  INVALID_AMOUNT: "perps.invalidAmount",
  INVALID_PARAM: "perps.orderFailed",
  INVALID_SALT: "perps.orderFailed",
  INVALID_SIGNATURE: "perps.orderFailed",
  INVALID_EXPIRY: "perps.orderFailed",
  INVALID_TIME_IN_FORCE: "perps.orderFailed",
  PAIR_NOT_FOUND: "perps.orderFailed",
  USER_BALANCES_ID_NOT_FOUND: "perps.orderFailed",
  AMOUNT_NOT_MATCH: "perps.orderFailed",
  ORDER_DUPLICATE: "perps.orderFailed",
  MIN_TRADE_AMOUNT: "perps.orderFailed",
};

function looksLikeErrorCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

/** Map spot API ErrorCode / raw msg to localized copy for place-order UX. */
export function getPerpsOrderErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  if (error instanceof ApiRequestError) {
    const fromCode = PERPS_ERROR_CODE_I18N[error.code];
    if (fromCode) return t(fromCode);
    const fromMsg = PERPS_ERROR_CODE_I18N[error.message];
    if (fromMsg) return t(fromMsg);
    if (looksLikeErrorCode(error.message)) return fallback;
  }

  const raw = getApiErrorMessage(error, "");
  if (raw && PERPS_ERROR_CODE_I18N[raw]) {
    return t(PERPS_ERROR_CODE_I18N[raw]);
  }
  if (raw && looksLikeErrorCode(raw)) {
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
}
