"use client";

import { useEffect, useState } from "react";

export interface SpeedyOfficeOption {
  id: string;
  type: "office" | "locker";
  name: string;
  city: string;
  address: string;
}

// Module-level cache, shared across every mount of this hook for the page's
// whole lifetime — same reasoning as useSettlements.ts's own cache. The
// underlying nationwide Speedy office search is slow (~30s) even cached
// server-side across users, so this also means SpeedyOfficePicker only
// ever triggers this fetch once per page visit, however many times the
// person switches between "Speedy" and "Speedy (автомат)".
let cachedOffices: SpeedyOfficeOption[] | null = null;
let inFlightRequest: Promise<SpeedyOfficeOption[]> | null = null;

function loadOffices(): Promise<SpeedyOfficeOption[]> {
  if (cachedOffices) return Promise.resolve(cachedOffices);
  inFlightRequest ??= fetch("/api/shipping/speedy/offices")
    .then((response) => {
      if (!response.ok) throw new Error("failed to load Speedy offices");
      return response.json();
    })
    .then((data: { offices: SpeedyOfficeOption[] }) => {
      cachedOffices = data.offices;
      return data.offices;
    })
    .finally(() => {
      inFlightRequest = null;
    });
  return inFlightRequest;
}

/** Client-side fetch of every real Speedy office/locker in Bulgaria (see /api/shipping/speedy/offices), cached for the page's lifetime. */
export function useSpeedyOffices(): { offices: SpeedyOfficeOption[]; loadError: boolean; isLoading: boolean } {
  const [offices, setOffices] = useState<SpeedyOfficeOption[]>(cachedOffices ?? []);
  const [loadError, setLoadError] = useState(false);
  // Tracked explicitly rather than derived from `offices.length === 0` — a
  // *successful* response could in principle still come back empty, and
  // that must read as "done, no data" rather than "still loading" forever.
  const [hasSettled, setHasSettled] = useState(cachedOffices !== null);

  useEffect(() => {
    if (cachedOffices) return;

    let cancelled = false;
    loadOffices()
      .then((result) => {
        if (cancelled) return;
        setOffices(result);
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

  return { offices, loadError, isLoading: !hasSettled };
}
