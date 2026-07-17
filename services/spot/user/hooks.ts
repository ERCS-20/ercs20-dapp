"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import {
  addUserPair,
  deleteUserPair,
  listUserPairs,
  reorderUserPairs,
} from "@/services/spot/user/api";
import type {
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
} from "@/services/spot/user/types";

export function userPairsQueryKey() {
  return ["spot", "user", "pairs"] as const;
}

/** POST /users/userPairs/pairs — favorite / pinned pairs for the signed-in user. */
export function useUserPairs(options?: {
  enabled?: boolean;
  notifyError?: boolean;
}) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<UserPairsRsp>({
    queryKey: userPairsQueryKey(),
    queryFn: () => listUserPairs(),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useAddUserPair() {
  const queryClient = useQueryClient();

  return useApiMutation<UserPairsRsp, Error, UserPairAddReq>({
    mutationFn: (req) => addUserPair(req),
    onSuccess: (data) => {
      queryClient.setQueryData(userPairsQueryKey(), data);
      void queryClient.invalidateQueries({
        queryKey: ["spot", "market", "pairs", "user-pairs"],
      });
    },
  });
}

export function useDeleteUserPair() {
  const queryClient = useQueryClient();

  return useApiMutation<UserPairsRsp, Error, UserPairDeleteReq>({
    mutationFn: (req) => deleteUserPair(req),
    onSuccess: (data) => {
      queryClient.setQueryData(userPairsQueryKey(), data);
      void queryClient.invalidateQueries({
        queryKey: ["spot", "market", "pairs", "user-pairs"],
      });
    },
  });
}

export function useReorderUserPairs() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, UserPairsReorderReq>({
    mutationFn: (req) => reorderUserPairs(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userPairsQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: ["spot", "market", "pairs", "user-pairs"],
      });
    },
  });
}
