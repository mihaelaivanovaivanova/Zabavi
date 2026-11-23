"use client";

import { useState } from "react";
import type { BoxNowSettingsPublic } from "@/domain/settings/types";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function BoxNowSettingsForm({ initial }: { initial: BoxNowSettingsPublic }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [clientId, setClientId] = useState(initial.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [originLocationId, setOriginLocationId] = useState(initial.originLocationId);
  const [originContactName, setOriginContactName] = useState(initial.originContactName);
  const [originContactEmail, setOriginContactEmail] = useState(initial.originContactEmail);
  const [originContactNumber, setOriginContactNumber] = useState(initial.originContactNumber);
  const [partnerId, setPartnerId] = useState(initial.partnerId);
  const [clientSecretConfigured, setClientSecretConfigured] = useState(initial.clientSecretConfigured);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/box-now", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        apiUrl,
        clientId,
        originLocationId,
        originContactName,
        originContactEmail,
        originContactNumber,
        partnerId,
        ...(clientSecret ? { clientSecret } : {}),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }

    setClientSecret("");
    setClientSecretConfigured(data.data.clientSecretConfigured);
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">BOX NOW</h2>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 accent-burgundy-700"
          />
          Активно
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Partner API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        <InputField label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <InputField
          label="Client Secret"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder={clientSecretConfigured ? "Зададен — остави празно, за да запазиш текущия" : "Client secret"}
        />
        <InputField label="Partner ID (незадължително)" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} />
        <InputField
          label="ID на склада (origin location)"
          value={originLocationId}
          onChange={(e) => setOriginLocationId(e.target.value)}
        />
        <InputField
          label="Име за контакт в склада"
          value={originContactName}
          onChange={(e) => setOriginContactName(e.target.value)}
        />
        <InputField
          label="Имейл за контакт в склада"
          type="email"
          value={originContactEmail}
          onChange={(e) => setOriginContactEmail(e.target.value)}
        />
        <InputField
          label="Телефон за контакт в склада"
          value={originContactNumber}
          onChange={(e) => setOriginContactNumber(e.target.value)}
        />
      </div>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази BOX NOW"}
      </Button>
    </form>
  );
}
