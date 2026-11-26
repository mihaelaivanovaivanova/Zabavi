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

  useEffect(() => {
    if (cachedLockers) return;

    let cancelled = false;
    loadLockers()
      .then((result) => {
        if (!cancelled) setLockers(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The real feed is never actually empty once it arrives (~900 rows) — so
  // "nothing yet" reliably means "still in flight", not "no results".
  const isLoading = lockers.length === 0 && !loadError;

  return { lockers, loadError, isLoading };
}
