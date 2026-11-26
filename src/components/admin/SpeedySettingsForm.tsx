"use client";

import { useState } from "react";
import type { SpeedySettingsPublic } from "@/domain/settings/types";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function SpeedySettingsForm({ initial }: { initial: SpeedySettingsPublic }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState("");
  const [dropoffOfficeId, setDropoffOfficeId] = useState(initial.dropoffOfficeId);
  const [serviceId, setServiceId] = useState(initial.serviceId);
  const [passwordConfigured, setPasswordConfigured] = useState(initial.passwordConfigured);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/speedy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        apiUrl,
        username,
        dropoffOfficeId,
        serviceId,
        ...(password ? { password } : {}),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }

    setPassword("");
    setPasswordConfigured(data.data.passwordConfigured);
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">Спиди</h2>
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

      <p className="text-sm text-ink-700">
        Куриерският метод в сайта създава реална пратка през Спиди Web API веднага щом тук е зададено и активно.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        <InputField label="Потребителско име" value={username} onChange={(e) => setUsername(e.target.value)} />
        <InputField
          label="Парола"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={passwordConfigured ? "Зададена — остави празно, за да запазиш текущата" : "Парола"}
        />
        <InputField
          label="ID на офис за предаване (dropoff)"
          value={dropoffOfficeId}
          onChange={(e) => setDropoffOfficeId(e.target.value)}
        />
        <InputField
          label="Service ID"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          placeholder="505"
        />
      </div>
      <p className="text-xs text-ink-700">
        Service ID по подразбиране е 505 (стандартна куриерска услуга) — провери в своя профил в Спиди, защото е
        специфичен за акаунта.
      </p>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази Спиди"}
      </Button>
    </form>
  );
}
