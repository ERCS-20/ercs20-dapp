import { request } from "@/lib/api/request";
import { SpotUserPairsApi } from "@/services/spot/user/paths";
import type {
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
} from "@/services/spot/user/types";

/** POST /users/userPairs/pairs — `userId` from gateway JWT headers. */
export function listUserPairs() {
  return request.post<UserPairsRsp>(SpotUserPairsApi.pairs);
}

/** POST /users/userPairs/add — `userId` from gateway JWT headers. */
export function addUserPair(req: UserPairAddReq) {
  return request.post<UserPairsRsp>(SpotUserPairsApi.add, {
    pairId: req.pairId,
  });
}

/** POST /users/userPairs/delete — `userId` from gateway JWT headers. */
export function deleteUserPair(req: UserPairDeleteReq) {
  return request.post<UserPairsRsp>(SpotUserPairsApi.delete, {
    pairId: req.pairId,
  });
}

/** POST /users/userPairs/reorder — `userId` from gateway JWT headers. */
export function reorderUserPairs(req: UserPairsReorderReq) {
  return request.post<void>(SpotUserPairsApi.reorder, {
    pairIds: req.pairIds,
  });
}
