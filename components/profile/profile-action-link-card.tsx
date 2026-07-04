"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ProfileActionLinkCard({
  href,
  icon,
  title,
  description,
  tone = "brand",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "brand" | "brand-alt";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border-border/60 bg-muted/20 hover:bg-muted/45 active:bg-muted/55 flex w-full items-center gap-4 rounded-2xl border p-4 transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          tone === "brand" ? "bg-brand/10 text-brand" : "bg-brand-alt/10 text-brand-alt"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-foreground text-base font-semibold">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-sm leading-snug">{description}</p>
      </div>
    </Link>
  );
}
