"use client";

import { useEffect, useMemo, useState } from "react";
import { inputClasses } from "@/components/ui/Field";

export interface SettlementSelection {
  label: string;
  postalCode: string;
}

interface SettlementOption {
  id: string;
  type: string;
  name: string;
  municipality: string;
  region: string;
  postalCode: string;
}

function settlementLabel(settlement: SettlementOption): string {
  return `${settlement.type} ${settlement.name} (общ. ${settlement.municipality}, обл. ${settlement.region})`;
}

/**
 * Bulgaria's full settlement list ("Населено място") as a searchable
 * dropdown, same mechanism as `BoxNowLockerPicker.tsx` — backed by
 * `/api/content/settlements` (Speedy's real nomenclature, cached
 * server-side), ported from smisul.bg's own checkout picker.
 */
export function SettlementPicker({
  value,
  onSelect,
  error,
}: {
  value: string;
  onSelect: (selection: SettlementSelection) => void;
  error?: string;
}) {
  const [settlements, setSettlements] = useState<SettlementOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState(value);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/settlements")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load settlements");
        return response.json();
      })
      .then((data: { settlements: SettlementOption[] }) => {
        if (!cancelled) setSettlements(data.settlements);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return settlements.filter((settlement) => settlement.name.toLowerCase().includes(term)).slice(0, 50);
  }, [settlements, search]);

  function handleSelectChange(id: string) {
    const settlement = settlements.find((candidate) => candidate.id === id);
    if (!settlement) return;
    const label = settlementLabel(settlement);
    setSearch(label);
    onSelect({ label, postalCode: settlement.postalCode });
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-burgundy-600">
        Неуспешно зареждане на списъка с населени места. Опитай да презаредиш страницата.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-800" htmlFor="settlement-search">
        Населено място
      </label>
      <input
        id="settlement-search"
        type="text"
        className={inputClasses}
        placeholder="Избери град или село…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {search.trim() && search !== value ? (
        <select
          className={inputClasses}
          size={Math.min(Math.max(filtered.length, 1), 8)}
          onChange={(event) => handleSelectChange(event.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            {filtered.length === 0 ? `Няма намерени резултати за "${search}"` : "Избери от списъка…"}
          </option>
          {filtered.map((settlement) => (
            <option key={settlement.id} value={settlement.id}>
              {settlementLabel(settlement)}
            </option>
          ))}
        </select>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
