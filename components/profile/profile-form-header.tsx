import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ProfileFormHeader({
  icon,
  title,
  description,
  tone = "brand",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "brand" | "brand-alt";
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl [&_svg]:size-6 [&_svg]:shrink-0",
          tone === "brand" ? "bg-brand/10 text-brand" : "bg-brand-alt/10 text-brand-alt"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
