export class ApiRequestError extends Error {
  readonly name = "ApiRequestError";

  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

export class ApiNetworkError extends Error {
  readonly name = "ApiNetworkError";

  constructor(message: string) {
    super(message);
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError || error instanceof ApiNetworkError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
