"use client";

import { useEffect, useState } from "react";

export interface Settlement {
  id: string;
  type: string;
  name: string;
  municipality: string;
  region: string;
  postalCode: string;
}

/** Client-side fetch of Bulgaria's full settlement nomenclature (see /api/content/settlements). */
export function useSettlements(): { settlements: Settlement[]; loadError: boolean } {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/settlements")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load settlements");
        return response.json();
      })
      .then((data: { settlements: Settlement[] }) => {
        if (!cancelled) setSettlements(data.settlements);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settlements, loadError };
}
