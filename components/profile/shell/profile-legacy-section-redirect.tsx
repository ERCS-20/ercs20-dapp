"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { legacySectionToPath } from "@/lib/profile/routes";

export function ProfileLegacySectionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const target = legacySectionToPath(searchParams.get("section"));
    if (target) router.replace(target);
  }, [router, searchParams]);

  return null;
}
