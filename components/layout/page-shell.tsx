import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Full-bleed page gutter: tight on mobile, edge-to-edge from lg up (matches Spot). */
export const pageShellClass =
  "mx-auto w-full px-3 py-2 sm:px-4 lg:px-0 lg:py-0";

export function PageShell({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Component className={cn(pageShellClass, className)}>{children}</Component>
  );
}
