"use client";

import { useState } from "react";
import type { IllustrationsSectionContent } from "@/domain/content/types";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function IllustrationsSectionForm({ initial }: { initial: IllustrationsSectionContent }) {
  const [heading, setHeading] = useState(initial.heading);
  const [intro, setIntro] = useState(initial.intro);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/illustrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, intro }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <h2 className="text-lg font-semibold text-ink-900">Секция „Четирите илюстрации“</h2>

      <InputField
        label="Заглавие на секцията"
        value={heading}
        onChange={(event) => setHeading(event.target.value)}
        required
      />

      <TextareaField
        label="Текст под заглавието"
        value={intro}
        onChange={(event) => setIntro(event.target.value)}
        placeholder="остави празно, за да няма текст"
      />

      <p className="text-xs text-ink-700">
        Заглавието и обяснението под всяка от четирите илюстрации се задават поотделно за всеки комплект, през
        /admin/kits.
      </p>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази"}
      </Button>
    </form>
  );
}
