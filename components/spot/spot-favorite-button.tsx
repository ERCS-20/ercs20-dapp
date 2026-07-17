"use client";

import { useMemo } from "react";
import { StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  useAddUserPair,
  useDeleteUserPair,
  useUserPairs,
} from "@/services/spot/user/hooks";

export function SpotFavoriteButton({
  pairId,
  className,
}: {
  pairId: number | undefined;
  className?: string;
}) {
  const { t } = useI18n();
  const { isAuthenticated, openLoginDialog } = useAuth();
  const { data: userPairs } = useUserPairs({
    enabled: isAuthenticated,
    notifyError: false,
  });
  const { mutateAsync: addPair, isPending: isAdding } = useAddUserPair();
  const { mutateAsync: deletePair, isPending: isDeleting } = useDeleteUserPair();

  const favorited = useMemo(() => {
    if (pairId == null || !userPairs?.pairs?.length) return false;
    return userPairs.pairs.some((p) => p.pairId === pairId);
  }, [pairId, userPairs?.pairs]);

  const busy = isAdding || isDeleting;

  async function toggle() {
    if (!isAuthenticated) {
      openLoginDialog();
      return;
    }
    if (pairId == null || busy) return;

    if (favorited) {
      await deletePair({ pairId });
      return;
    }
    await addPair({ pairId });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pairId == null || busy}
      onClick={(e) => {
        e.stopPropagation();
        void toggle();
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
