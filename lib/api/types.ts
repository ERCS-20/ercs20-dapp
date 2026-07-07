/** Backend envelope: `{ code, msg, data }`. */
export type ApiEnvelope<T> = {
  code: string;
  msg: string;
  data: T;
};

export const API_SUCCESS_CODE = "success";

export function isApiSuccess<T>(body: ApiEnvelope<T>): boolean {
  return body.code === API_SUCCESS_CODE;
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Skip envelope unwrap (raw JSON body). */
  raw?: boolean;
  /** Internal: retried once after token refresh. */
  _authRetried?: boolean;
};
