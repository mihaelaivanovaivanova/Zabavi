"use client";

import { useEffect, useState } from "react";

export interface BoxNowLockerOption {
  id: string;
  city: string;
  addressLine1: string;
  postalCode: string;
  name: string;
}

// Module-level cache, shared across every mount of this hook for the page's
// whole lifetime — same reasoning as useSettlements.ts's own cache: without
// it, switching delivery methods back and forth remounts BoxNowLockerPicker
// each time, firing a fresh ~900-row fetch every time; opening the city
// field before that fresh fetch resolves showed an empty list even though
// the data was already fetched once already.
let cachedLockers: BoxNowLockerOption[] | null = null;
let inFlightRequest: Promise<BoxNowLockerOption[]> | null = null;

function loadLockers(): Promise<BoxNowLockerOption[]> {
  if (cachedLockers) return Promise.resolve(cachedLockers);
  inFlightRequest ??= fetch("/api/box-now/lockers")
    .then((response) => {
      if (!response.ok) throw new Error("failed to load lockers");
      return response.json();
    })
    .then((data: { lockers: BoxNowLockerOption[] }) => {
      cachedLockers = data.lockers;
      return data.lockers;
    })
    .finally(() => {
      inFlightRequest = null;
    });
  return inFlightRequest;
}

/** Client-side fetch of BOX NOW's real, public, credential-free locations feed (see /api/box-now/lockers), cached for the page's lifetime. */
export function useBoxNowLockers(): { lockers: BoxNowLockerOption[]; loadError: boolean; isLoading: boolean } {
  const [lockers, setLockers] = useState<BoxNowLockerOption[]>(cachedLockers ?? []);
  const [loadError, setLoadError] = useState(false);
  // Tracked explicitly rather than derived from `lockers.length === 0` — a
  // *successful* response could in principle still come back empty, and
  // that must read as "done, no data" rather than "still loading" forever.
  const [hasSettled, setHasSettled] = useState(cachedLockers !== null);

  useEffect(() => {
    if (cachedLockers) return;

    let cancelled = false;
    loadLockers()
      .then((result) => {
        if (cancelled) return;
        setLockers(result);
        // The real feed is never actually empty once a fetch truly
        // succeeds (~900 rows) — treat a successful-but-empty response the
        // same as a fetch failure rather than loading forever.
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

  return { lockers, loadError, isLoading: !hasSettled };
}
