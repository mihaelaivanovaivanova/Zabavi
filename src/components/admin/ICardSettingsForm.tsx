"use client";

import { useState } from "react";
import type { ICardSettingsPublic } from "@/domain/settings/types";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function ICardSettingsForm({ initial }: { initial: ICardSettingsPublic }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [originator, setOriginator] = useState(initial.originator);
  const [mid, setMid] = useState(initial.mid);
  const [midName, setMidName] = useState(initial.midName);
  const [keyIndex, setKeyIndex] = useState(initial.keyIndex);
  const [ipgVersion, setIpgVersion] = useState(initial.ipgVersion);
  const [language, setLanguage] = useState(initial.language);
  const [privateKey, setPrivateKey] = useState("");
  const [icardPublicKey, setIcardPublicKey] = useState("");
  const [privateKeyConfigured, setPrivateKeyConfigured] = useState(initial.privateKeyConfigured);
  const [icardPublicKeyConfigured, setIcardPublicKeyConfigured] = useState(initial.icardPublicKeyConfigured);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/icard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        apiUrl,
        originator,
        mid,
        midName,
        keyIndex,
        ipgVersion,
        language,
        ...(privateKey ? { privateKey } : {}),
        ...(icardPublicKey ? { icardPublicKey } : {}),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }

    setPrivateKey("");
    setIcardPublicKey("");
    setPrivateKeyConfigured(data.data.privateKeyConfigured);
    setIcardPublicKeyConfigured(data.data.icardPublicKeyConfigured);
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">iCard</h2>
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
        <InputField label="IPG API URL" type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        <InputField label="Originator" value={originator} onChange={(e) => setOriginator(e.target.value)} />
        <InputField label="MID" value={mid} onChange={(e) => setMid(e.target.value)} />
        <InputField label="MID Name" value={midName} onChange={(e) => setMidName(e.target.value)} />
        <InputField label="Key Index" value={keyIndex} onChange={(e) => setKeyIndex(e.target.value)} />
        <InputField label="IPG Version" value={ipgVersion} onChange={(e) => setIpgVersion(e.target.value)} />
        <InputField label="Език" value={language} onChange={(e) => setLanguage(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Частен RSA ключ (PEM)"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder={privateKeyConfigured ? "Зададен — остави празно, за да запазиш текущия" : "Постави ключа"}
        />
        <InputField
          label="Публичен ключ на iCard (PEM)"
          value={icardPublicKey}
          onChange={(e) => setIcardPublicKey(e.target.value)}
          placeholder={icardPublicKeyConfigured ? "Зададен — остави празно, за да запазиш текущия" : "Постави ключа"}
        />
      </div>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази iCard"}
      </Button>
    </form>
  );
}
