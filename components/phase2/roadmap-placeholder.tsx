"use client";

import { useI18n } from "@/providers/i18n-provider";

type Phase2Key = "spot" | "futures" | "pools";

export function RoadmapPlaceholder({ page }: { page: Phase2Key }) {
  const { t } = useI18n();
  const prefix = `phase2.${page}` as const;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        {t(`${prefix}.title`)}
      </h1>
      <p className="text-muted-foreground mt-3 text-base leading-relaxed">
        {t(`${prefix}.body`)}
      </p>
      <div className="bg-muted/35 border-border/65 mt-8 rounded-2xl border p-5 shadow-sm transition-[box-shadow,transform] duration-300 ease-out hover:shadow-md sm:p-6">
        <h2 className="text-foreground text-sm font-semibold tracking-[0.12em] uppercase">
          {t("common.roadmap")}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t(`${prefix}.roadmap`)}
        </p>
      </div>
    </div>
  );
}
