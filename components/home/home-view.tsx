"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  Coins,
  Layers,
  Repeat2,
  ShieldAlert,
  Waves,
} from "lucide-react";

import {
  HOME_PROTOCOL_BLOCKS_START,
  getHomeContractCopy,
} from "@/lib/content/home-contract";
import type { HomeBlock } from "@/lib/content/home-contract";
import { HeroVisual } from "@/components/home/hero-visual";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/providers/i18n-provider";

/** Comfortable reading width inside a wider protocol column (cards/quotes span full). */
const protocolProse = "mx-auto w-full max-w-[40rem]";

/** Wider intro column for the “Design rationale” heading + lead paragraph. */
const protocolRationaleIntro = "mx-auto w-full max-w-[48rem]";

function renderFixSectionBlock(block: HomeBlock, i: number) {
  const key = `${block.type}-${i}`;
  const problemIcons: LucideIcon[] = [Coins, ShieldAlert, Waves, CircleDollarSign, Repeat2];
  switch (block.type) {
    case "kicker":
      return (
        <p
          key={key}
          className={cn(
            protocolProse,
            "text-muted-foreground/90 text-[11px] font-medium tracking-[0.22em] text-balance uppercase"
          )}
        >
          {block.text}
        </p>
      );
    case "h1":
      return (
        <h3
          key={key}
          className={cn(
            protocolProse,
            "text-foreground text-[1.625rem] leading-snug font-semibold tracking-[-0.02em] text-balance sm:text-3xl"
          )}
        >
          {block.text}
        </h3>
      );
    case "h2":
      return (
        <h2
          key={key}
          className={cn(
            protocolProse,
            "text-foreground mt-16 scroll-mt-28 text-[1.375rem] leading-snug font-semibold tracking-[-0.018em] text-balance first:mt-10 sm:text-[1.5rem]"
          )}
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={key}
          className={cn(
            protocolProse,
            "text-foreground mt-9 text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] sm:text-lg"
          )}
        >
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p
          key={key}
          className={cn(
            protocolProse,
            "text-muted-foreground text-[17px] leading-[1.588] text-pretty sm:text-[19px] sm:leading-[1.5]"
          )}
        >
          {block.text}
        </p>
      );
    case "ol":
      return (
        <ol
          key={key}
          className="grid list-none grid-cols-1 gap-4 pl-0 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-5"
        >
          {block.items.map((item, j) => (
            <li
              key={j}
              className="border-border/60 bg-muted/30 dark:bg-white/[0.05] flex flex-col rounded-2xl border p-5 text-pretty shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <span className="text-muted-foreground/70 mb-3 inline-flex size-10 shrink-0 items-center justify-center self-center rounded-full border border-border/60 bg-background/60 text-[15px] font-semibold tabular-nums dark:bg-black/20 sm:size-11 sm:text-base">
                {(() => {
                  const Icon = problemIcons[j];
                  if (!Icon) return j + 1;
                  return (
                    <Icon className="size-[18px] sm:size-5" strokeWidth={1.65} aria-hidden />
                  );
                })()}
              </span>
              <span className="text-foreground text-[16px] leading-snug font-semibold tracking-[-0.01em] sm:text-[17px]">
                {item.title}
              </span>
              <span className="text-muted-foreground mt-2.5 block text-[15px] leading-[1.55] sm:text-[16px] sm:leading-[1.5]">
                {item.body}
              </span>
            </li>
          ))}
        </ol>
      );
    case "ul":
      return (
        <ul
          key={key}
          className={cn(
            protocolProse,
            "text-muted-foreground space-y-3.5 pl-0 text-[17px] leading-[1.55] sm:text-[19px]"
          )}
        >
          {block.items.map((item, j) => (
            <li
              key={j}
              className="text-pretty border-foreground/12 dark:border-white/10 border-l-2 py-0.5 pl-4"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <div
          key={key}
          className="border-border/45 bg-muted/20 dark:bg-white/[0.03] -mx-6 border-y px-6 py-5 sm:-mx-8 sm:px-8"
        >
          <blockquote className="text-muted-foreground max-w-none text-[14px] leading-relaxed sm:text-[15px]">
            {block.text}
          </blockquote>
        </div>
      );
    default:
      return null;
  }
}

function RationaleChapterInner({
  block,
  index,
}: {
  block: HomeBlock;
  index: number;
}) {
  const key = `rationale-inner-${index}-${block.type}`;
  switch (block.type) {
    case "p":
      return (
        <p
          key={key}
          className="text-muted-foreground text-[17px] leading-[1.588] text-pretty sm:text-[19px] sm:leading-[1.5]"
        >
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul
          key={key}
          className="text-muted-foreground space-y-4 pl-0 text-[17px] leading-[1.55] sm:text-[19px]"
        >
          {block.items.map((item, j) => (
            <li
              key={j}
              className="text-pretty border-foreground/10 dark:border-white/10 bg-background/40 dark:bg-black/20 rounded-r-lg border-l-2 py-2 pl-4"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <div
          key={key}
          className="border-border/40 mt-2 border-t border-dashed pt-5"
        >
          <p className="text-muted-foreground text-[13px] leading-relaxed sm:text-[14px]">
            {block.text}
          </p>
        </div>
      );
    default:
      return null;
  }
}

function RationaleChapter({
  blocks,
  chapterKey,
}: {
  blocks: HomeBlock[];
  chapterKey: string;
}) {
  const head = blocks[0];
  if (!head || head.type !== "h3") return null;
  const rest = blocks.slice(1);

  return (
    <article
      className="border-border/60 bg-muted/25 dark:bg-white/[0.05] w-full rounded-2xl border px-6 py-7 shadow-sm transition-shadow duration-300 ease-out hover:shadow-md sm:px-8 sm:py-9"
    >
      <h3 className="text-foreground text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] sm:text-lg">
        {head.text}
      </h3>
      {rest.length > 0 && (
        <div className="mt-6 space-y-6">
          {rest.map((b, j) => (
            <RationaleChapterInner key={`${chapterKey}-${j}`} block={b} index={j} />
          ))}
        </div>
      )}
    </article>
  );
}

function RationaleLooseBlock({ block, i }: { block: HomeBlock; i: number }) {
  const key = `rationale-loose-${i}`;
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={key}
          className={cn(
            protocolRationaleIntro,
            "text-foreground mt-0 scroll-mt-28 text-[1.375rem] leading-snug font-semibold tracking-[-0.018em] text-balance sm:text-[1.5rem]"
          )}
        >
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p
          key={key}
          className={cn(
            protocolRationaleIntro,
            "text-muted-foreground text-[17px] leading-[1.588] text-pretty sm:text-[19px] sm:leading-[1.5]"
          )}
        >
          {block.text}
        </p>
      );
    default:
      return null;
  }
}

function RationaleTail({ blocks }: { blocks: HomeBlock[] }) {
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "h3") {
      const chunk: HomeBlock[] = [b];
      i += 1;
      while (i < blocks.length && blocks[i].type !== "h3") {
        chunk.push(blocks[i]);
        i += 1;
      }
      nodes.push(
        <RationaleChapter
          key={`rat-ch-${nodes.length}`}
          chapterKey={`rat-ch-${nodes.length}`}
          blocks={chunk}
        />
      );
    } else {
      nodes.push(<RationaleLooseBlock key={`rat-loose-${i}`} block={b} i={i} />);
      i += 1;
    }
  }

  return (
    <div className="mt-14 space-y-8 sm:mt-16">
      {nodes}
    </div>
  );
}

function ProtocolDocument({ blocks }: { blocks: HomeBlock[] }) {
  const olIdx = blocks.findIndex((b) => b.type === "ol");
  const fixBlocks = olIdx >= 0 ? blocks.slice(0, olIdx + 1) : blocks;
  const rationaleBlocks = olIdx >= 0 ? blocks.slice(olIdx + 1) : [];

  return (
    <div className="space-y-6">
      {fixBlocks.map((block, i) => renderFixSectionBlock(block, i))}
      {rationaleBlocks.length > 0 && <RationaleTail blocks={rationaleBlocks} />}
    </div>
  );
}

function HomeHeroFeaturePill({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 bg-background/70 text-muted-foreground inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] shadow-sm backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:px-4 sm:text-sm dark:border-white/12 dark:bg-black/30",
        className
      )}
    >
      <Icon className="text-foreground size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="text-foreground/90 text-pretty">{label}</span>
    </div>
  );
}

function AppleHeroLink({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[52px] min-w-[10.5rem] items-center justify-center rounded-full px-8 text-[17px] font-medium tracking-[-0.01em] transition-[transform,opacity,background-color,box-shadow,border-color] duration-300 ease-out active:scale-[0.98] sm:min-w-[11.5rem]",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 dark:shadow-primary/20",
        variant === "secondary" &&
          "border-border/70 bg-background/50 text-foreground hover:bg-muted/60 border backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.07] dark:hover:bg-white/[0.12]",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function HomeView() {
  const { locale, t } = useI18n();
  const copy = getHomeContractCopy(locale);
  const protocolBlocks = copy.blocks.slice(HOME_PROTOCOL_BLOCKS_START);

  return (
    <PageShell as="div" className="flex flex-1 flex-col lg:py-0">
      <section
        className="hero-motion relative isolate flex min-h-[calc(100svh-11rem)] flex-col items-center justify-center px-0 pt-8 pb-16 sm:min-h-[calc(100svh-5rem)] sm:pt-10 sm:pb-24"
        aria-label="Hero"
      >
        {/* Ambient light + vector focal — minimal, high-end */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 opacity-100 dark:opacity-85"
            style={{
              background:
                "radial-gradient(ellipse 120% 85% at 50% -35%, oklch(0.92 0.07 175 / 0.5), transparent 58%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-0 dark:opacity-100"
            style={{
              background:
                "radial-gradient(ellipse 100% 65% at 50% -22%, oklch(0.34 0.12 350 / 0.42), transparent 52%)",
            }}
          />
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              background:
                "radial-gradient(ellipse 75% 48% at 82% 105%, oklch(0.96 0.045 185 / 0.42), transparent 48%)",
            }}
          />
        </div>
        <HeroVisual />

        <div className="relative z-10 mx-auto flex w-full max-w-[46rem] flex-col items-center text-center">
          <p
            className="text-muted-foreground mb-3 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium tracking-[0.08em] uppercase duration-700 ease-out"
          >
            {t("home.heroBadge")}
          </p>

          <h1 className="text-primary animate-in fade-in slide-in-from-bottom-3 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance delay-75 duration-700 ease-out sm:text-5xl sm:tracking-[-0.04em] md:text-6xl md:leading-[1.02]">
            {t("home.heroTitle")}
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-[40rem] animate-in fade-in slide-in-from-bottom-2 text-[17px] leading-[1.6] font-normal text-pretty delay-150 duration-700 ease-out sm:mt-7 sm:max-w-[44rem] sm:text-[18px] sm:leading-[1.6]">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-8 flex w-full max-w-xl flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-3 delay-200 duration-700 ease-out sm:mt-9 sm:gap-2.5">
            <HomeHeroFeaturePill icon={Layers} label={t("home.heroFeatureAmm")} />
            <HomeHeroFeaturePill icon={ArrowLeftRight} label={t("home.heroFeatureTrade")} />
            <HomeHeroFeaturePill icon={CircleDollarSign} label={t("home.heroFeatureFees")} />
          </div>

          <div className="mt-11 flex w-full max-w-md animate-in fade-in slide-in-from-bottom-3 flex-col items-center gap-3 delay-300 duration-700 ease-out sm:mt-14 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <AppleHeroLink href="/swap" variant="primary" className="w-full sm:w-auto">
              {t("home.ctaSwap")}
            </AppleHeroLink>
            <AppleHeroLink href="/ercs-20" variant="secondary" className="w-full sm:w-auto">
              {t("home.ctaErcs20")}
            </AppleHeroLink>
          </div>

          <a
            href="#protocol"
            className="text-muted-foreground hover:text-foreground group mt-20 inline-flex animate-in fade-in flex-col items-center gap-2 text-[13px] font-medium tracking-wide delay-500 duration-700 ease-out transition-colors sm:mt-28"
          >
            <span>{t("home.learnMore")}</span>
            <ChevronDown
              className="size-4 opacity-60 transition-transform duration-500 ease-out group-hover:translate-y-1"
              strokeWidth={1.5}
            />
          </a>
        </div>
      </section>

      <section
        id="protocol"
        className="scroll-mt-20"
        aria-labelledby="protocol-heading"
      >
        <div className="border-border/40 from-muted/20 to-background relative border-t bg-gradient-to-b pb-24 sm:pb-32 dark:from-white/[0.04] dark:to-background">
          <div className="mx-auto w-full max-w-6xl px-0 pt-20 sm:pt-28 lg:px-3">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-[0.22em] uppercase">
              {t("home.protocolEyebrow")}
            </p>
            <h2
              id="protocol-heading"
              className="text-foreground mt-3 text-center text-[1.75rem] leading-tight font-semibold tracking-[-0.028em] sm:text-[2rem]"
            >
              {t("home.protocolTitle")}
            </h2>

            <div
              className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-4 sm:mt-10"
              aria-hidden
            >
              <span className="via-border/50 h-px flex-1 bg-gradient-to-r from-transparent to-border/70 dark:to-white/15" />
              <div className="border-border/50 bg-muted/30 flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                <BookOpen className="text-muted-foreground size-[1.15rem]" strokeWidth={1.75} />
              </div>
              <span className="via-border/50 h-px flex-1 bg-gradient-to-l from-transparent to-border/70 dark:to-white/15" />
            </div>

            <div className="mt-12 sm:mt-14">
              <ProtocolDocument blocks={protocolBlocks} />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
