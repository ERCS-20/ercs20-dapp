"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  MoonIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
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
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
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
    <header className="border-border/70 bg-background/85 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,border-color] duration-300">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 lg:max-w-none lg:px-0">
        {/* Uniswap-style: logo + nav grouped on the left */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 lg:gap-5 lg:pl-3">
          <Link
            href="/"
            aria-label={t("brand")}
            className="text-foreground group inline-flex shrink-0 items-center transition-opacity duration-300 hover:opacity-85"
          >
            <span className="border-border/80 bg-muted/25 dark:bg-muted/20 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2 shadow-sm transition-[transform,box-shadow] duration-300 ease-out group-hover:shadow-md sm:h-11 sm:w-11">
              <Image
                src="/brand/orbix.svg"
                alt=""
                width={40}
                height={40}
                className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                style={{ width: "auto", height: "auto" }}
                priority
                unoptimized
              />
            </span>
          </Link>

          <nav
            className={cn(
              "scrollbar-none flex min-w-0 items-center overflow-x-auto overscroll-x-contain",
              "gap-0.5 sm:gap-1",
              "lg:overflow-visible"
            )}
            aria-label="Primary"
          >
            {navPaths.map(({ href, key }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-9 shrink-0 items-center px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-200 ease-out sm:min-h-10 sm:px-3.5",
                    "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:transition-opacity after:duration-200 sm:after:inset-x-3.5",
                    active
                      ? "text-foreground after:bg-primary after:opacity-100"
                      : "text-muted-foreground hover:text-foreground after:opacity-0"
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative z-[60] ml-2 flex shrink-0 items-center gap-2 sm:gap-2.5 lg:gap-3 lg:pr-3">
          {/* Desktop: language dropdown + theme toggle */}
          <div className="hidden items-center gap-2 sm:flex lg:gap-3">
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

          {/* Mobile: settings icon opens bottom sheet (theme + language) */}
          <Sheet open={mobilePrefsOpen} onOpenChange={setMobilePrefsOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="inline-flex shrink-0 sm:hidden"
                aria-label={t("common.settings")}
                aria-haspopup="dialog"
              >
                <Settings2Icon className="size-5" strokeWidth={1.5} aria-hidden />
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

          <ConnectWalletButton />
        </div>
      </div>

      {/* Mobile: Sheet handles overlay + focus, so no extra markup here */}
    </header>
  );
}
