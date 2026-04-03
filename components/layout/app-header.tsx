"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n/messages";
import { useI18n } from "@/providers/i18n-provider";

const navPaths = [
  { href: "/", key: "nav.home" },
  { href: "/swap", key: "nav.swap" },
  { href: "/spot", key: "nav.spot" },
  { href: "/futures", key: "nav.futures" },
  { href: "/pools", key: "nav.pools" },
  { href: "/ercs-20", key: "nav.ercs20" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setThemeReady(true));
  }, []);

  return (
    <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-foreground shrink-0 text-lg font-semibold tracking-tight"
        >
          {t("brand")}
        </Link>

        <nav
          className="scrollbar-none -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-1 sm:gap-1"
          aria-label="Primary"
        >
          {navPaths.map(({ href, key }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <span className="max-w-[4.5rem] truncate sm:max-w-none">
                  {localeLabels[locale]}
                </span>
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(v) => setLocale(v as Locale)}
              >
                {locales.map((loc) => (
                  <DropdownMenuRadioItem key={loc} value={loc}>
                    {localeLabels[loc]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={
              themeReady
                ? resolvedTheme === "dark"
                  ? t("common.themeLight")
                  : t("common.themeDark")
                : t("common.theme")
            }
            onClick={() => {
              if (!themeReady) return;
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            {!themeReady ? (
              <SunIcon className="size-4 opacity-50" aria-hidden />
            ) : resolvedTheme === "dark" ? (
              <MoonIcon className="size-4" aria-hidden />
            ) : (
              <SunIcon className="size-4" aria-hidden />
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/88 border-0 shadow-none hidden rounded-full px-4 font-medium transition-[opacity,transform] active:scale-[0.98] sm:inline-flex dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90"
            onClick={() => toast.message(t("wallet.connectPlaceholder"))}
          >
            {t("wallet.connect")}
          </Button>
        </div>
      </div>

      <div className="border-border/60 flex justify-center border-t px-4 py-2 sm:hidden">
        <Button
          type="button"
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/88 w-full max-w-sm rounded-full border-0 py-2.5 font-medium shadow-none transition-[opacity,transform] active:scale-[0.98] dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90"
          onClick={() => toast.message(t("wallet.connectPlaceholder"))}
        >
          {t("wallet.connect")}
        </Button>
      </div>
    </header>
  );
}
