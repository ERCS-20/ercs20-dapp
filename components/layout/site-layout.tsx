"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground relative isolate flex min-h-screen flex-col">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-background"
        aria-hidden
      />
      <div
        className="page-surface-grid pointer-events-none fixed inset-0 -z-10 opacity-50"
        aria-hidden
      />
      <div className="page-grain pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <AppHeader />
      <main className="relative z-0 flex flex-1 flex-col">{children}</main>
    </div>
  );
}
