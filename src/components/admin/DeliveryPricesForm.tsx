"use client";

import { useState } from "react";
import type { ShippingPrices } from "@/infrastructure/settings/shippingPricesService";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

const FIELDS: { key: keyof ShippingPrices; label: string }[] = [
  { key: "box_now", label: "BOX NOW (€)" },
  { key: "speedy_office", label: "Speedy — офис (€)" },
  { key: "speedy_locker", label: "Speedy — автомат (€)" },
  { key: "courier", label: "Speedy — до адрес (€)" },
];

export function DeliveryPricesForm({ initial }: { initial: ShippingPrices }) {
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(({ key }) => [key, String(initial[key])])),
  );
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/shipping-prices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(FIELDS.map(({ key }) => [key, Number(prices[key]) || 0]))),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }

    setPrices(Object.fromEntries(FIELDS.map(({ key }) => [key, String(data.data[key])])));
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <h2 className="text-lg font-semibold text-ink-900">Цени на доставка</h2>
      <p className="text-sm text-ink-700">Цена по подразбиране е 0 € (безплатна доставка) за всеки метод, докато не зададеш друга.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <InputField
            key={key}
            label={label}
            type="number"
            step="0.01"
            min={0}
            value={prices[key]}
            onChange={(e) => setPrices((current) => ({ ...current, [key]: e.target.value }))}
          />
        ))}
      </div>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази цените"}
      </Button>
    </form>
  );
}
