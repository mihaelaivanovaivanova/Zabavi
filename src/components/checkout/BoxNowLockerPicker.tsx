"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { inputClasses } from "@/components/ui/Field";

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
  onSelect: (selection: BoxNowSelection) => void;
  error?: string;
}

/**
 * Lists real BOX NOW lockers from their public, credential-free locations
 * feed (proxied through /api/box-now/lockers) as a searchable dropdown,
 * instead of embedding their map widget.
 */
export function BoxNowLockerPicker({ selected, onSelect, error }: BoxNowLockerPickerProps) {
  const [lockers, setLockers] = useState<BoxNowLockerOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredLockers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return lockers
      .filter(
        (locker) =>
          locker.city.toLowerCase().includes(term) ||
          locker.addressLine1.toLowerCase().includes(term) ||
          locker.postalCode.includes(term) ||
          locker.name.toLowerCase().includes(term),
      )
      .slice(0, 50);
  }, [lockers, search]);

  const selectedLocker = lockers.find((locker) => locker.id === selected?.lockerId);

  function handleSelectChange(id: string) {
    const locker = lockers.find((candidate) => candidate.id === id);
    if (!locker) return;
    onSelect({ lockerId: locker.id, addressLine1: `${locker.addressLine1}, ${locker.city}`, postalCode: locker.postalCode });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-800">Автомат BOX NOW</span>
        <Badge tone="neutral">Реални локации</Badge>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-burgundy-600">
          Неуспешно зареждане на локациите на BOX NOW. Опитай да презаредиш страницата.
        </p>
      ) : (
        <>
          <input
            type="text"
            className={inputClasses}
            placeholder="Търси по град, адрес или пощенски код…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.trim() ? (
            <select
              className={inputClasses}
              size={Math.min(Math.max(filteredLockers.length, 1), 8)}
              value={selected?.lockerId ?? ""}
              onChange={(event) => handleSelectChange(event.target.value)}
            >
              {filteredLockers.length === 0 ? (
                <option disabled>Няма намерени автомати за &quot;{search}&quot;</option>
              ) : (
                filteredLockers.map((locker) => (
                  <option key={locker.id} value={locker.id}>
                    {locker.city} — {locker.addressLine1} ({locker.postalCode})
                  </option>
                ))
              )}
            </select>
          ) : (
            <p className="text-sm text-ink-700">Напиши град, адрес или пощенски код, за да видиш автоматите.</p>
          )}
        </>
      )}

      {selectedLocker ? (
        <p className="text-sm text-ink-700">
          Избран автомат: {selectedLocker.city} — {selectedLocker.addressLine1}, {selectedLocker.postalCode}
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
