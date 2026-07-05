/** Mirrors `exchange.orbix.components.pagination.SortField`. */
export type PaginationSortField = {
  fieldName?: string;
  sortType?: string;
};

/** Mirrors `exchange.orbix.components.pagination.RowBounds`. */
export type PaginationRowBounds = {
  offset?: number;
  limit?: number;
};

/** Mirrors `exchange.orbix.components.pagination.PaginationCondition`. */
export type PaginationCondition<T> = {
  pageSize?: number;
  currentPage?: number;
  condition?: T;
  sort?: PaginationSortField[];
  rowBounds?: PaginationRowBounds;
  isQueryCount?: boolean;
  closeMaxDefaultPageSize?: boolean;
};

/** Mirrors `exchange.orbix.components.pagination.PaginationRepertory`. */
export type PaginationRepertory<T> = {
  currentIndex: number;
  totalCount: number;
  totalPage: number;
  pageItems: T[];
};
