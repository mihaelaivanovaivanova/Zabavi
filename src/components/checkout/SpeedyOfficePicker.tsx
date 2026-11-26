"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useSettlements } from "@/lib/useSettlements";

export interface SpeedyOfficeSelection {
  officeId: string;
  officeLabel: string;
  city: string;
}

interface SpeedyOfficeOption {
  id: string;
  name: string;
  city: string;
  address: string;
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
 * Two cascading dropdowns (city, then office/locker) — same shape as
 * BoxNowLockerPicker.tsx's city/locker cascade. City options come from
 * Bulgaria's full settlement nomenclature (bgTransliteration.ts gives
 * bilingual search); the office/locker list is then fetched live from
 * Speedy for just that city — a nationwide, unfiltered call is too slow
 * (~30s) to offer up front.
 */
export function SpeedyOfficePicker({ type, selected, onSelect, error }: SpeedyOfficePickerProps) {
  const { settlements, loadError: settlementsError, isLoading: isLoadingSettlements } = useSettlements();
  // null means "not yet manually touched" — the city then falls back to
  // whichever office is already selected (e.g. navigating back to this
  // step), derived at render time instead of synced in via an effect.
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const city = cityOverride ?? selected?.city ?? "";

  const [offices, setOffices] = useState<SpeedyOfficeOption[]>([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(false);
  const [officesError, setOfficesError] = useState(false);

  useEffect(() => {
    // Nothing to fetch yet: the render below only reads `offices` once a
    // city is chosen, so a stale list from a previous city is never shown.
    if (!city) return;

    let cancelled = false;
    // Deferred to a microtask so the initial "start loading" update doesn't
    // set state synchronously within the effect body (matches the pattern
    // used by CartContext.tsx's own hydration effect).
    Promise.resolve().then(() => {
      if (!cancelled) {
        setIsLoadingOffices(true);
        setOfficesError(false);
      }
    });
    fetch(`/api/shipping/speedy/offices?type=${type}&city=${encodeURIComponent(city)}`)
      .then((response) => {
        if (!response.ok) throw new Error("failed to load offices");
        return response.json();
      })
      .then((data: { offices: SpeedyOfficeOption[] }) => {
        if (!cancelled) setOffices(data.offices);
      })
      .catch(() => {
        if (!cancelled) setOfficesError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOffices(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, type]);

  // Case-insensitive de-dup — Speedy's own search takes a plain city name,
  // so distinct settlements sharing one (e.g. villages in different
  // regions) collapse into a single entry here.
  const cities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const settlement of settlements) {
      if (!settlement.name || seen.has(settlement.name.toLowerCase())) continue;
      seen.set(settlement.name.toLowerCase(), settlement.name);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "bg"));
  }, [settlements]);

  const cityOptions = useMemo(() => cities.map((cityOption) => ({ value: cityOption, label: cityOption })), [cities]);
  const officeOptions = useMemo(() => offices.map((office) => ({ value: office.id, label: officeLabel(office) })), [offices]);

  if (settlementsError) {
    return (
      <p role="alert" className="text-sm text-burgundy-600">
        Неуспешно зареждане на списъка с населени места. Опитай да презаредиш страницата.
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
          isLoading={isLoadingSettlements}
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
        {officesError ? (
          <p role="alert" className="text-sm text-burgundy-600">
            Неуспешно зареждане на локациите на Speedy. Опитай отново.
          </p>
        ) : isLoadingOffices ? (
          <p className="text-sm text-ink-700">Зареждане…</p>
        ) : (
          <SearchableSelect
            id={`speedy-${type}-office`}
            value={selected?.officeId ?? ""}
            options={officeOptions}
            placeholder={type === "office" ? "Избери офис" : "Избери автомат"}
            disabled={!city}
            error={error}
            onChange={(officeId) => {
              const office = offices.find((candidate) => candidate.id === officeId);
              if (office) onSelect({ officeId: office.id, officeLabel: officeLabel(office), city: office.city });
            }}
          />
        )}
      </div>
    </div>
  );
}
