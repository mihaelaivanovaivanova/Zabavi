"use client";

import { useEffect, useState } from "react";
import type { KitDetails } from "@/domain/kit/types";

/** Client-side fetch of the public, read-only per-kit price/photo data (see /api/kits). */
export function useKits(): { kits: KitDetails[]; isLoading: boolean } {
  const [kits, setKits] = useState<KitDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/kits")
      .then((response) => response.json())
      .then((data: { kits?: KitDetails[] }) => {
        if (!cancelled) setKits(data.kits ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { kits, isLoading };
}
