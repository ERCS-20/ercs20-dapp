export const profileTableSectionClass =
  "border-border/60 bg-card w-full min-w-0 rounded-2xl border p-5 sm:p-6";

export const profileTableWrapClass = "mt-4 w-full min-w-0";

/**
 * Shared profile table layout.
 * Row height matches deposit rows (icon + symbol + address).
 * Use `tr` height — `min-height` on `td` is ignored in table layout.
 */
export const profileTableClass =
  "min-w-[44rem] w-full [&_thead_th]:h-11 [&_thead_th]:px-3 [&_thead_th]:align-middle [&_tbody_tr]:h-14 [&_tbody_td]:!px-3 [&_tbody_td]:!py-3 [&_tbody_td]:align-middle";

export const profileTableFilterSelectClass =
  "border-border bg-background text-foreground h-9 min-w-[9rem] rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
