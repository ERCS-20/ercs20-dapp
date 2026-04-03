"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, MoreHorizontal, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n/messages";
import { useI18n } from "@/providers/i18n-provider";

const navPaths = [
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
  const [mobilePrefsOpen, setMobilePrefsOpen] = useState(false);

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
          {/* Mobile: placeholder glyph icon, desktop: wordmark */}
          <span className="inline-flex items-center sm:hidden" aria-label={t("brand")}>
            <span className="flex size-9 items-center justify-center rounded-full border border-border/70 text-[13px] font-semibold tracking-[0.09em]">
              E
            </span>
          </span>
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        <nav
          className="scrollbar-none -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-1 sm:gap-1"
          aria-label="Primary"
        >
          {navPaths.map(({ href, key }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
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

        <div className="relative z-[60] flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Desktop: language dropdown + theme toggle */}
          <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
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
          </div>

          {/* Mobile: three-dots trigger for bottom sheet (theme + language) */}
          <Sheet open={mobilePrefsOpen} onOpenChange={setMobilePrefsOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="inline-flex shrink-0 sm:hidden"
                aria-label={t("common.theme")}
                aria-haspopup="dialog"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="border-t px-4 pb-5 pt-3 sm:max-w-none"
            >
              <SheetHeader className="mb-3 flex flex-row items-center justify-between gap-2 p-0">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <SheetTitle className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {t("common.settings")}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {t("common.theme")} and {t("common.language")}
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium"
                  >
                    X
                  </button>
                </SheetClose>
              </SheetHeader>

              <div className="flex flex-col gap-1">
                <div className="flex min-h-11 items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {t("common.theme")}
                  </span>
                  <Switch
                    leadingIcon={<SunIcon className="size-3" aria-hidden />}
                    trailingIcon={<MoonIcon className="size-3" aria-hidden />}
                    checked={themeReady && resolvedTheme === "dark"}
                    disabled={!themeReady}
                    onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
                    aria-label={
                      themeReady
                        ? resolvedTheme === "dark"
                          ? t("common.themeDark")
                          : t("common.themeLight")
                        : t("common.theme")
                    }
                  />
                </div>

                <div className="flex min-h-11 items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {t("common.language")}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-w-36 shrink-0 justify-between gap-2 font-normal"
                      >
                        <span className="truncate">{localeLabels[locale]}</span>
                        <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="z-[110] min-w-[var(--radix-dropdown-menu-trigger-width)]"
                    >
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
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Connect: shared pill button on all breakpoints */}
          <Button
            type="button"
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/88 inline-flex rounded-full border-0 px-3.5 py-1.5 text-xs font-medium shadow-none transition-[opacity,transform] active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90"
            onClick={() => toast.message(t("wallet.connectPlaceholder"))}
          >
            {t("wallet.connect")}
          </Button>
        </div>
      </div>

      {/* Mobile: Sheet handles overlay + focus, so no extra markup here */}
    </header>
  );
}
