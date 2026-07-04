"use client";

import { useEffect } from "react";
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { notifyApiError } from "@/lib/api/notify-error";

type ApiMutationOptions<TData, TError, TVariables, TContext> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
>;

/** TanStack Query mutation; failed requests toast backend `msg` only. */
export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: ApiMutationOptions<TData, TError, TVariables, TContext>
) {
  const { onError, ...rest } = options;

  return useMutation({
    ...rest,
    onError: (error, variables, onMutateResult, context) => {
      notifyApiError(error);
      onError?.(error, variables, onMutateResult, context);
    },
  });
}

type ApiQueryOptions<TData, TError> = UseQueryOptions<TData, TError> & {
  /** When true, toast backend `msg` on query failure (default false). */
  notifyError?: boolean;
};

/** TanStack Query query wrapper. */
export function useApiQuery<TData, TError = Error>(
  options: ApiQueryOptions<TData, TError>
) {
  const { notifyError = false, ...rest } = options;
  const query = useQuery(rest);

  useEffect(() => {
    if (!notifyError || !query.isError) return;
    notifyApiError(query.error);
  }, [notifyError, query.isError, query.error]);

  return query;
}
