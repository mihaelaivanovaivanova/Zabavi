"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useSettlements } from "@/lib/useSettlements";

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
 * Bulgaria's full settlement list ("Населено място") as a bilingual
 * (Cyrillic or Latin) searchable dropdown, same mechanism as
 * SpeedyOfficePicker.tsx's own city field — backed by
 * /api/content/settlements (Speedy's real nomenclature, cached).
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
  const { settlements, loadError, isLoading } = useSettlements();

  // The settlement's own id isn't exposed to the caller (only the
  // formatted label + postal code are), so the current selection is
  // matched back by label — same approach the old free-text version used.
  const selectedId = useMemo(() => settlements.find((settlement) => settlementLabel(settlement) === value)?.id ?? "", [settlements, value]);

  const options = useMemo(
    // searchText is just the settlement's own name — searching "Sofia" should
    // find гр. София, not every village whose municipality/region happens to
    // contain "София" (which the full disambiguated label would also match).
    () => settlements.map((settlement) => ({ value: settlement.id, label: settlementLabel(settlement), searchText: settlement.name })),
    [settlements],
  );

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-burgundy-600">
        Неуспешно зареждане на списъка с населени места. Опитай да презаредиш страницата.
      </p>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor="settlement-search">
        Населено място
      </label>
      <SearchableSelect
        id="settlement-search"
        value={selectedId}
        options={options}
        placeholder="Избери населено място"
        error={error}
        isLoading={isLoading}
        onChange={(settlementId) => {
          const settlement = settlements.find((candidate) => candidate.id === settlementId);
          if (settlement) onSelect({ label: settlementLabel(settlement), postalCode: settlement.postalCode });
        }}
      />
    </div>
  );
}
