import { request } from "@/lib/api/request";
import { ChainApi } from "@/services/chain/paths";
import type { Ercs20PaginationReq, Ercs20PaginationRsp } from "@/services/chain/types";

/** POST /chain/ercs20/pagination */
export function paginationErcs20(req: Ercs20PaginationReq) {
  return request.post<Ercs20PaginationRsp>(ChainApi.ercs20Pagination, req);
}
