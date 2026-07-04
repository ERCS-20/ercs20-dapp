"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

export function ProfileSpotPanel() {
  const { t } = useI18n();
  const { isConnected } = useWallet();

  return (
    <div className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6">
      <h2 className="text-foreground text-base font-medium">{t("profile.spotTitle")}</h2>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {t("profile.spotDesc")}
      </p>

      {!isConnected ? (
        <p className="text-muted-foreground mt-4 text-sm">{t("profile.notConnected")}</p>
      ) : (
        <Button className="mt-6 h-11 rounded-xl px-6" asChild>
          <Link href="/spot">
            {t("profile.goToSpot")}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </Button>
      )}
    </div>
  );
}
