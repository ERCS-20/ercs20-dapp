"use client";

import { useApiQuery } from "@/lib/api/hooks";
import { paginationErcs20 } from "@/services/chain/api";
import type { Ercs20PaginationReq, Ercs20PaginationRsp } from "@/services/chain/types";

export function useErcs20Pagination(
  req: Ercs20PaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<Ercs20PaginationRsp>({
    queryKey: ["chain", "ercs20", "pagination", req],
    queryFn: () => paginationErcs20(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}
