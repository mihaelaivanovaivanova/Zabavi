"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export interface BoxNowSelection {
  lockerId: string;
  addressLine1: string;
  postalCode: string;
}

interface BoxNowLockerOption {
  id: string;
  city: string;
  addressLine1: string;
  postalCode: string;
  name: string;
}

interface BoxNowLockerPickerProps {
  selected: BoxNowSelection | null;
  onSelect: (selection: BoxNowSelection | null) => void;
  error?: string;
}

function lockerLabel(locker: BoxNowLockerOption): string {
  return `${locker.name} — ${locker.addressLine1}`;
}

/**
 * Two cascading dropdowns (city, then locker) over BOX NOW's real, public,
 * credential-free locations feed (proxied through /api/box-now/lockers) —
 * city options are derived from the data itself, same pattern as
 * smisul.bg's own `OfficePicker`. Both fields accept either Cyrillic or
 * Latin search text (see bgTransliteration.ts).
 */
export function BoxNowLockerPicker({ selected, onSelect, error }: BoxNowLockerPickerProps) {
  const [lockers, setLockers] = useState<BoxNowLockerOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  // null means "not yet manually touched" — the city then falls back to
  // whichever locker is already selected (e.g. navigating back to this
  // step), derived at render time instead of synced in via an effect.
  const [cityOverride, setCityOverride] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/box-now/lockers")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load lockers");
        return response.json();
      })
      .then((data: { lockers: BoxNowLockerOption[] }) => {
        if (!cancelled) setLockers(data.lockers);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLocker = lockers.find((locker) => locker.id === selected?.lockerId) ?? null;
  const city = cityOverride ?? selectedLocker?.city ?? "";

  // Case-insensitive de-dup (keeping whichever casing is seen first) — the
  // real feed isn't perfectly consistent about a city's casing across entries.
  const cities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const locker of lockers) {
      if (!locker.city || seen.has(locker.city.toLowerCase())) continue;
      seen.set(locker.city.toLowerCase(), locker.city);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "bg"));
  }, [lockers]);

  const lockersInCity = useMemo(
    () => lockers.filter((locker) => locker.city.toLowerCase() === city.toLowerCase()),
    [lockers, city],
  );

  const cityOptions = useMemo(() => cities.map((cityOption) => ({ value: cityOption, label: cityOption })), [cities]);
  const lockerOptions = useMemo(
    () => lockersInCity.map((locker) => ({ value: locker.id, label: lockerLabel(locker) })),
    [lockersInCity],
  );

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-burgundy-600">
        Неуспешно зареждане на локациите на BOX NOW. Опитай да презаредиш страницата.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor="box-now-city">
          Град
        </label>
        <SearchableSelect
          id="box-now-city"
          value={city}
          options={cityOptions}
          placeholder="Избери град"
          onChange={(nextCity) => {
            setCityOverride(nextCity);
            onSelect(null);
          }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor="box-now-locker">
          Автомат
        </label>
        <SearchableSelect
          id="box-now-locker"
          value={selected?.lockerId ?? ""}
          options={lockerOptions}
          placeholder="Избери автомат"
          disabled={!city}
          error={error}
          onChange={(lockerId) => {
            const locker = lockersInCity.find((candidate) => candidate.id === lockerId);
            if (locker) {
              onSelect({ lockerId: locker.id, addressLine1: `${locker.addressLine1}, ${locker.city}`, postalCode: locker.postalCode });
            }
          }}
        />
      </div>
    </div>
  );
}
