"use client";

import { useState } from "react";
import type { HowItWorksContent, HowItWorksStep } from "@/domain/content/types";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField, inputClasses } from "@/components/ui/Field";
import { moveItemTo } from "@/lib/listOrder";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function HowItWorksSectionForm({ initial }: { initial: HowItWorksContent }) {
  const [heading, setHeading] = useState(initial.heading);
  const [steps, setSteps] = useState<HowItWorksStep[]>(initial.steps);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function updateStep(index: number, patch: Partial<HowItWorksStep>) {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    setSteps((current) => [...current, { title: "", description: "" }]);
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number, event: React.DragEvent) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(index: number, event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  }

  function handleDrop(index: number, event: React.DragEvent) {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setSteps((current) => moveItemTo(current, dragIndex, index));
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    // Drop steps the admin left fully blank (e.g. an added-then-abandoned
    // step) instead of forcing them to either fill it in or delete it.
    const trimmed = steps
      .map((step) => ({ title: step.title.trim(), description: step.description.trim() }))
      .filter((step) => step.title !== "" || step.description !== "");

    const response = await fetch("/api/admin/settings/how-it-works", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, steps: trimmed }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }
    setSteps(trimmed);
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <h2 className="text-lg font-semibold text-ink-900">Секция „Как протича рисуването“</h2>

      <InputField label="Заглавие на секцията" value={heading} onChange={(event) => setHeading(event.target.value)} required />

      <p className="text-xs text-ink-700">Плъзни стъпка, за да я пренаредиш.</p>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            draggable
            onDragStart={(event) => handleDragStart(index, event)}
            onDragOver={(event) => handleDragOver(index, event)}
            onDrop={(event) => handleDrop(index, event)}
            onDragEnd={handleDragEnd}
            className={`flex gap-3 rounded-xl border border-lavender-200 bg-paper-50 p-3 transition-opacity ${
              dragIndex === index ? "opacity-40" : ""
            } ${dragOverIndex === index && dragIndex !== index ? "ring-2 ring-burgundy-500" : ""}`}
          >
            <span
              aria-hidden="true"
              title="Плъзни, за да пренаредиш"
              className="mt-2 cursor-grab text-lg text-ink-700 active:cursor-grabbing"
            >
              ⠿
            </span>
            <div className="flex-1 space-y-2">
              <InputField
                id={`how-it-works-title-${index}`}
                label={`Стъпка №${index + 1}`}
                value={step.title}
                onChange={(event) => updateStep(index, { title: event.target.value })}
              />
              <TextareaField
                id={`how-it-works-description-${index}`}
                label="Описание"
                value={step.description}
                onChange={(event) => updateStep(index, { description: event.target.value })}
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="text-left text-sm text-ink-700 underline underline-offset-4"
              >
                Премахни стъпката
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addStep}
        className={`${inputClasses} w-full text-center text-sm font-medium text-burgundy-700`}
      >
        + Добави стъпка
      </button>

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
