"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { inputClasses } from "@/components/ui/Field";

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
  /** Which of Speedy's two pickup-point kinds to search — a nationwide, unfiltered call is slow (~30s), so a city is required before searching either. */
  type: "office" | "locker";
  selected: SpeedyOfficeSelection | null;
  onSelect: (selection: SpeedyOfficeSelection) => void;
  error?: string;
}

/** Real Speedy offices/automated machines, searched live by city — same role as `BoxNowLockerPicker.tsx` for BOX NOW. */
export function SpeedyOfficePicker({ type, selected, onSelect, error }: SpeedyOfficePickerProps) {
  const [city, setCity] = useState(selected?.city ?? "");
  const [offices, setOffices] = useState<SpeedyOfficeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const term = city.trim();
    if (term.length < 2) {
      // Nothing to clear: the render below only reads `offices` once
      // `city.trim().length >= 2`, so a stale list from a longer, since-
      // shortened query is never shown.
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      setIsLoading(true);
      setLoadError(false);
      fetch(`/api/shipping/speedy/offices?type=${type}&city=${encodeURIComponent(term)}`)
        .then((response) => {
          if (!response.ok) throw new Error("failed to load offices");
          return response.json();
        })
        .then((data: { offices: SpeedyOfficeOption[] }) => {
          if (!cancelled) setOffices(data.offices);
        })
        .catch(() => {
          if (!cancelled) setLoadError(true);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [city, type]);

  const selectedOffice = offices.find((office) => office.id === selected?.officeId);

  function handleSelectChange(id: string) {
    const office = offices.find((candidate) => candidate.id === id);
    if (!office) return;
    onSelect({ officeId: office.id, officeLabel: `${office.name} — ${office.address}`, city: office.city });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-800">{type === "office" ? "Офис на Speedy" : "Автомат на Speedy"}</span>
        <Badge tone="neutral">Реални локации</Badge>
      </div>

      <input
        type="text"
        className={inputClasses}
        placeholder="Избери град…"
        value={city}
        onChange={(event) => setCity(event.target.value)}
      />

      {loadError ? (
        <p role="alert" className="text-sm text-burgundy-600">
          Неуспешно зареждане на локациите на Speedy. Опитай отново.
        </p>
      ) : city.trim().length < 2 ? (
        <p className="text-sm text-ink-700">Въведи поне 2 букви от града.</p>
      ) : isLoading ? (
        <p className="text-sm text-ink-700">Зареждане…</p>
      ) : (
        <select
          className={inputClasses}
          size={Math.min(Math.max(offices.length, 1), 8)}
          value={selected?.officeId ?? ""}
          onChange={(event) => handleSelectChange(event.target.value)}
        >
          {offices.length === 0 ? (
            <option disabled>Няма намерени {type === "office" ? "офиси" : "автомати"} за &quot;{city}&quot;</option>
          ) : (
            offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name} — {office.address}
              </option>
            ))
          )}
        </select>
      )}

      {selectedOffice ? (
        <p className="text-sm text-ink-700">
          Избрано: {selectedOffice.name} — {selectedOffice.address}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
