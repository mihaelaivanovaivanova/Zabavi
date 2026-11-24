"use client";

import { useState } from "react";
import type { IllustrationsSectionContent } from "@/domain/content/types";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function IllustrationsSectionForm({ initial }: { initial: IllustrationsSectionContent }) {
  const [heading, setHeading] = useState(initial.heading);
  const [intro, setIntro] = useState(initial.intro);
  const [items, setItems] = useState(initial.items);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  function updateItem(index: number, patch: Partial<{ title: string; description: string }>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch("/api/admin/settings/illustrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, intro, items }),
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

      <div className="space-y-4">
        <span className="text-sm font-medium text-ink-800">Илюстрации</span>
        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-lavender-200 p-3 sm:grid-cols-2">
            <InputField
              id={`illustration-title-${index}`}
              label={`Заглавие на илюстрация №${index + 1}`}
              value={item.title}
              onChange={(event) => updateItem(index, { title: event.target.value })}
              required
            />
            <InputField
              id={`illustration-description-${index}`}
              label="Обяснение под заглавието"
              value={item.description}
              onChange={(event) => updateItem(index, { description: event.target.value })}
              placeholder="остави празно, за да няма обяснение"
            />
          </div>
        ))}
      </div>

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
