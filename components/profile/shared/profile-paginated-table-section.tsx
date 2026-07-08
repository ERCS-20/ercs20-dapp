"use client";

import type { ReactNode } from "react";

import { ProfileTablePaginationFooter } from "@/components/profile/shared/profile-table-pagination-footer";
import { Table } from "@/components/ui/table";
import { profileTableClass, profileTableSectionClass, profileTableWrapClass } from "@/lib/profile/table-filters";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type PaginationFooterProps = Omit<
  React.ComponentProps<typeof ProfileTablePaginationFooter>,
  "colSpan" | "pageJumpId"
>;

type Props = {
  title: string;
  filters?: ReactNode;
  showFilters?: boolean;
  isLoading: boolean;
  totalCount: number;
  hasRows: boolean;
  hasFilters: boolean;
  emptyMessage: string;
  filterEmptyMessage?: string;
  header: ReactNode;
  children: ReactNode;
  footerColSpan: number;
  pageJumpId: string;
  footerProps: PaginationFooterProps;
};

export function ProfilePaginatedTableSection({
  title,
  filters,
  showFilters = false,
  isLoading,
  totalCount,
  hasRows,
  hasFilters,
  emptyMessage,
  filterEmptyMessage,
  header,
  children,
  footerColSpan,
  pageJumpId,
  footerProps,
}: Props) {
  const { t } = useI18n();
  const { isAuthenticated, authReady } = useAuth();

  return (
    <section className={profileTableSectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-medium">{title}</h2>
        {showFilters && authReady && isAuthenticated ? filters : null}
      </div>

      {!authReady ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("swap.loading")}</p>
      ) : !isAuthenticated ? (
        <p className="text-muted-foreground mt-6 text-sm">{emptyMessage}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("swap.loading")}</p>
      ) : totalCount === 0 && !hasFilters ? (
        <p className="text-muted-foreground mt-6 text-sm">{emptyMessage}</p>
      ) : !hasRows ? (
        <p className="text-muted-foreground mt-6 text-sm">
          {filterEmptyMessage ?? t("profile.accountLedgerFilterEmpty")}
        </p>
      ) : (
        <div className={profileTableWrapClass}>
          <Table className={profileTableClass}>
            {header}
            {children}
            <ProfileTablePaginationFooter
              colSpan={footerColSpan}
              pageJumpId={pageJumpId}
              {...footerProps}
            />
          </Table>
        </div>
      )}
    </section>
  );
}
