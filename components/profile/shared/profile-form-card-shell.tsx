import type { ReactNode } from "react";

/**
 * Shared form card chrome — same pattern as the old withdraw card:
 * soft tinted pad (`bg-primary/10` + `p-1`) + light ring, reads as a glow/shadow
 * rather than a hard border stroke. Accent follows theme primary (teal / pink).
 */
export function ProfileFormCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="rounded-[28px] bg-primary/10 p-1 shadow-lg ring-1 ring-primary/20">
        <div className="rounded-[24px] bg-card p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
