/** Mirrors `exchange.orbix.spot.users.dto.UserPairRsp`. */
export type UserPairRsp = {
  id: number;
  pairId: number;
  sortOrder: number;
};

/** Mirrors `exchange.orbix.spot.users.dto.UserPairsRsp`. */
export type UserPairsRsp = {
  pairs: UserPairRsp[];
};

/** Mirrors `exchange.orbix.spot.users.dto.UserPairAddReq`. */
export type UserPairAddReq = {
  pairId: number;
};

/** Mirrors `exchange.orbix.spot.users.dto.UserPairDeleteReq`. */
export type UserPairDeleteReq = {
  pairId: number;
};

/** Mirrors `exchange.orbix.spot.users.dto.UserPairsReorderReq`. */
export type UserPairsReorderReq = {
  pairIds: number[];
};
