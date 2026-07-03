"use client";

import { useCallback, useEffect, useState } from "react";
import { StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const FAVORITES_KEY = "spot-favorite-pairs";
export const SPOT_FAVORITES_CHANGED = "spot-favorites-changed";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw) as string[];
    return new Set(list);
  } catch {
    return new Set();
  }
}

function writeFavorites(set: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event(SPOT_FAVORITES_CHANGED));
}

export function isPairFavorited(pairAddress: string): boolean {
  return readFavorites().has(pairAddress.toLowerCase());
}

export function useSpotFavorites(): Set<string> {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    sync();
    window.addEventListener(SPOT_FAVORITES_CHANGED, sync);
    return () => window.removeEventListener(SPOT_FAVORITES_CHANGED, sync);
  }, []);

  return favorites;
}

export function SpotFavoriteButton({
  pairAddress,
  className,
}: {
  pairAddress: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [favorited, setFavorited] = useState(false);

  const sync = useCallback(() => {
    setFavorited(readFavorites().has(pairAddress.toLowerCase()));
  }, [pairAddress]);

  useEffect(() => {
    sync();
    window.addEventListener(SPOT_FAVORITES_CHANGED, sync);
    return () => window.removeEventListener(SPOT_FAVORITES_CHANGED, sync);
  }, [sync]);

  const toggle = useCallback(() => {
    const next = readFavorites();
    const key = pairAddress.toLowerCase();
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeFavorites(next);
    setFavorited(next.has(key));
  }, [pairAddress]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={favorited ? t("spot.removeFavorite") : t("spot.addFavorite")}
      aria-pressed={favorited}
      className={cn(
        "text-muted-foreground hover:text-foreground shrink-0 rounded-lg",
        favorited && "text-brand hover:text-brand",
        className
      )}
    >
      <StarIcon
        className={cn("size-4", favorited && "fill-brand")}
        strokeWidth={1.75}
        aria-hidden
      />
    </Button>
  );
}
