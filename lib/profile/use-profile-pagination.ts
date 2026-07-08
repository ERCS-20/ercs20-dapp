"use client";

import { useCallback, useEffect, useState } from "react";

export const PROFILE_TABLE_PAGE_SIZE = 20;

type FooterMeta = {
  totalPage?: number;
  totalCount?: number;
  isFetching?: boolean;
};

export function useProfilePagination(pageSize = PROFILE_TABLE_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const buildFooterProps = useCallback(
    ({ totalPage = 0, totalCount = 0, isFetching = false }: FooterMeta) => {
      const pageTotal = Math.max(totalPage, 1);
      const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const rangeEnd = Math.min(currentPage * pageSize, totalCount);

      const jumpToPage = () => {
        const parsed = Number.parseInt(pageInput, 10);
        if (Number.isNaN(parsed)) {
          setPageInput(String(currentPage));
          return;
        }
        setCurrentPage(Math.min(Math.max(1, parsed), pageTotal));
      };

      return {
        currentPage,
        pageTotal,
        totalCount,
        rangeStart,
        rangeEnd,
        pageInput,
        isFetching,
        onPageInputChange: setPageInput,
        onPageJump: jumpToPage,
        onPrevPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
        onNextPage: () => setCurrentPage((page) => Math.min(pageTotal, page + 1)),
      };
    },
    [currentPage, pageInput, pageSize]
  );

  return {
    currentPage,
    setCurrentPage,
    resetPage,
    pageSize,
    buildFooterProps,
  };
}
