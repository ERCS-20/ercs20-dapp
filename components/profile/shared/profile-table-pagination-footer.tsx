"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { useI18n } from "@/providers/i18n-provider";

type Props = {
  colSpan: number;
  pageJumpId: string;
  currentPage: number;
  pageTotal: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  pageInput: string;
  isFetching: boolean;
  onPageInputChange: (value: string) => void;
  onPageJump: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ProfileTablePaginationFooter({
  colSpan,
  pageJumpId,
  currentPage,
  pageTotal,
  totalCount,
  rangeStart,
  rangeEnd,
  pageInput,
  isFetching,
  onPageInputChange,
  onPageJump,
  onPrevPage,
  onNextPage,
}: Props) {
  const { t } = useI18n();

  return (
    <TableFooter className="bg-transparent">
      <TableRow className="hover:bg-transparent border-0">
        <TableCell colSpan={colSpan} className="px-2 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>{t("profile.paginationTotal").replace("{total}", String(totalCount))}</span>
              <span className="bg-border/70 hidden h-3 w-px sm:inline-block" aria-hidden />
              <span>
                {t("profile.paginationRange")
                  .replace("{start}", String(rangeStart))
                  .replace("{end}", String(rangeEnd))}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div className="border-border/60 bg-background flex items-center rounded-lg border p-0.5 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-md"
                  disabled={currentPage <= 1 || isFetching}
                  aria-label={t("profile.paginationPrev")}
                  onClick={onPrevPage}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="text-foreground min-w-12 px-1 text-center text-xs font-medium tabular-nums">
                  {currentPage}
                  <span className="text-muted-foreground mx-0.5 font-normal">/</span>
                  {pageTotal}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-md"
                  disabled={currentPage >= pageTotal || isFetching}
                  aria-label={t("profile.paginationNext")}
                  onClick={onNextPage}
                >
                  <ChevronRightIcon />
                </Button>
              </div>

              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  onPageJump();
                }}
              >
                <label htmlFor={pageJumpId} className="text-muted-foreground shrink-0 text-xs">
                  {t("profile.paginationGoToPage")}
                </label>
                <Input
                  id={pageJumpId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  disabled={isFetching || pageTotal <= 1}
                  className="h-7 w-12 px-1.5 text-center text-xs tabular-nums"
                  aria-label={t("profile.paginationGoToPage")}
                  onChange={(e) => onPageInputChange(e.target.value.replace(/\D/g, ""))}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={isFetching || pageTotal <= 1 || !pageInput}
                >
                  {t("profile.paginationGo")}
                </Button>
              </form>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}
