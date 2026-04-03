"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
