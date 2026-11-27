"use client";

import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useSpeedyOffices, type SpeedyOfficeOption } from "@/lib/useSpeedyOffices";

export interface SpeedyOfficeSelection {
  officeId: string;
  officeLabel: string;
  city: string;
}

interface SpeedyOfficePickerProps {
  /** Which of Speedy's two pickup-point kinds to search. */
  type: "office" | "locker";
  selected: SpeedyOfficeSelection | null;
  onSelect: (selection: SpeedyOfficeSelection | null) => void;
  error?: string;
}

function officeLabel(office: SpeedyOfficeOption): string {
  return `${office.name} — ${office.address}`;
}

/**
 * Two cascading dropdowns (city, then office/locker) over every real
 * Speedy office/locker in Bulgaria (proxied through
 * /api/shipping/speedy/offices, fetched once) — city options are derived
 * from the data itself (only cities that actually have one of this `type`
 * are listed), same pattern as BoxNowLockerPicker.tsx and smisul.bg's own
 * `OfficePicker`. Both fields accept either Cyrillic or Latin search text
 * (see bgTransliteration.ts).
 */
export function SpeedyOfficePicker({ type, selected, onSelect, error }: SpeedyOfficePickerProps) {
  const { offices: allOffices, loadError, isLoading } = useSpeedyOffices();
  const relevantOffices = useMemo(() => allOffices.filter((office) => office.type === type), [allOffices, type]);

  // null means "not yet manually touched" — the city then falls back to
  // whichever office is already selected (e.g. navigating back to this
  // step), derived at render time instead of synced in via an effect.
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const selectedOffice = relevantOffices.find((office) => office.id === selected?.officeId) ?? null;
  const city = cityOverride ?? selectedOffice?.city ?? "";

  // Case-insensitive de-dup (keeping whichever casing is seen first) — the
  // real data isn't perfectly consistent about a city's casing across entries.
  const cities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const office of relevantOffices) {
      if (!office.city || seen.has(office.city.toLowerCase())) continue;
      seen.set(office.city.toLowerCase(), office.city);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "bg"));
  }, [relevantOffices]);

  const officesInCity = useMemo(
    () => relevantOffices.filter((office) => office.city.toLowerCase() === city.toLowerCase()),
    [relevantOffices, city],
  );

  const cityOptions = useMemo(() => cities.map((cityOption) => ({ value: cityOption, label: cityOption })), [cities]);
  const officeOptions = useMemo(
    () => officesInCity.map((office) => ({ value: office.id, label: officeLabel(office) })),
    [officesInCity],
  );

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-burgundy-600">
        Неуспешно зареждане на локациите на Speedy. Опитай да презаредиш страницата.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor={`speedy-${type}-city`}>
          Град
        </label>
        <SearchableSelect
          id={`speedy-${type}-city`}
          value={city}
          options={cityOptions}
          placeholder="Избери град"
          isLoading={isLoading}
          onChange={(nextCity) => {
            setCityOverride(nextCity);
            onSelect(null);
          }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor={`speedy-${type}-office`}>
          {type === "office" ? "Офис" : "Автомат"}
        </label>
        <SearchableSelect
          id={`speedy-${type}-office`}
          value={selected?.officeId ?? ""}
          options={officeOptions}
          placeholder={type === "office" ? "Избери офис" : "Избери автомат"}
          disabled={!city}
          error={error}
          onChange={(officeId) => {
            const office = officesInCity.find((candidate) => candidate.id === officeId);
            if (office) onSelect({ officeId: office.id, officeLabel: officeLabel(office), city: office.city });
          }}
        />
      </div>
    </div>
  );
}
