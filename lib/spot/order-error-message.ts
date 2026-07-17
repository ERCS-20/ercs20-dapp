import { ApiRequestError, getApiErrorMessage } from "@/lib/api/errors";

/** Backend `ErrorCode` → i18n key under `spot.*`. */
const SPOT_ERROR_CODE_I18N: Record<string, string> = {
  INSUFFICIENT_BALANCE: "spot.insufficientBalance",
  INVALID_AMOUNT: "spot.invalidAmount",
  INVALID_PARAM: "spot.orderFailed",
  INVALID_SALT: "spot.orderFailed",
  INVALID_SIGNATURE: "spot.orderFailed",
  INVALID_EXPIRY: "spot.orderFailed",
  INVALID_TIME_IN_FORCE: "spot.orderFailed",
  PAIR_NOT_FOUND: "spot.orderFailed",
  USER_BALANCES_ID_NOT_FOUND: "spot.orderFailed",
  AMOUNT_NOT_MATCH: "spot.orderFailed",
  ORDER_DUPLICATE: "spot.orderFailed",
  MIN_TRADE_AMOUNT: "spot.orderFailed",
};

function looksLikeErrorCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

/** Map spot API ErrorCode / raw msg to localized copy for place-order UX. */
export function getSpotOrderErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  if (error instanceof ApiRequestError) {
    const fromCode = SPOT_ERROR_CODE_I18N[error.code];
    if (fromCode) return t(fromCode);
    const fromMsg = SPOT_ERROR_CODE_I18N[error.message];
    if (fromMsg) return t(fromMsg);
    if (looksLikeErrorCode(error.message)) return fallback;
  }

  const raw = getApiErrorMessage(error, "");
  if (raw && SPOT_ERROR_CODE_I18N[raw]) {
    return t(SPOT_ERROR_CODE_I18N[raw]);
  }
  if (raw && looksLikeErrorCode(raw)) {
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
}
