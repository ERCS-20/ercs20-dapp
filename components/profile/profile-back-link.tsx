"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProfileBackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 py-1.5 pr-4 pl-1.5 text-sm font-medium transition-[color,background-color,transform] hover:bg-muted/55 active:scale-[0.98]",
        className
      )}
    >
      <span className="bg-background text-foreground flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-border/60 transition-transform duration-200 group-hover:-translate-x-0.5">
        <ArrowLeftIcon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
