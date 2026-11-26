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

// Module-level cache, shared across every mount of this hook for the page's
// whole lifetime — without it, switching delivery methods back and forth
// (BOX NOW -> Speedy -> BOX NOW -> Speedy, say) remounts SpeedyOfficePicker
// each time, firing a fresh ~5,300-row fetch every time; opening the city
// field before that fresh fetch resolves showed an empty "Няма съвпадения"
// list even though the data was already fetched once already.
let cachedSettlements: Settlement[] | null = null;
let inFlightRequest: Promise<Settlement[]> | null = null;

function loadSettlements(): Promise<Settlement[]> {
  if (cachedSettlements) return Promise.resolve(cachedSettlements);
  inFlightRequest ??= fetch("/api/content/settlements")
    .then((response) => {
      if (!response.ok) throw new Error("failed to load settlements");
      return response.json();
    })
    .then((data: { settlements: Settlement[] }) => {
      cachedSettlements = data.settlements;
      return data.settlements;
    })
    .finally(() => {
      inFlightRequest = null;
    });
  return inFlightRequest;
}

/** Client-side fetch of Bulgaria's full settlement nomenclature (see /api/content/settlements), cached for the page's lifetime. */
export function useSettlements(): { settlements: Settlement[]; loadError: boolean; isLoading: boolean } {
  const [settlements, setSettlements] = useState<Settlement[]>(cachedSettlements ?? []);
  const [loadError, setLoadError] = useState(false);
  // Tracked explicitly rather than derived from `settlements.length === 0`
  // — a *successful* response can still come back empty (e.g. the server's
  // own getSettlements() falls back to [] if Speedy isn't configured there
  // yet, or its own cache never warmed), and that must read as "done, no
  // data" rather than "still loading" forever.
  const [hasSettled, setHasSettled] = useState(cachedSettlements !== null);

  useEffect(() => {
    if (cachedSettlements) return;

    let cancelled = false;
    loadSettlements()
      .then((result) => {
        if (cancelled) return;
        setSettlements(result);
        // The real list is never actually empty once a fetch truly
        // succeeds (~5,300 rows) — a successful-but-empty response means
        // the data genuinely isn't available right now, same practical
        // outcome as a fetch failure for anything that depends on it.
        if (result.length === 0) setLoadError(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setHasSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settlements, loadError, isLoading: !hasSettled };
}
