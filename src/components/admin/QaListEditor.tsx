"use client";

import { useState } from "react";
import type { FaqItem } from "@/domain/content/types";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField, inputClasses } from "@/components/ui/Field";
import { moveItemTo } from "@/lib/listOrder";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

/**
 * Shared admin editor for an admin-managed question/answer list (drag to
 * reorder, add, remove) — backs both the FAQ and "Ами ако…" objections
 * settings forms, which only differ in heading, endpoint, and field id
 * prefix (needed since both render on /admin/settings at once).
 */
export function QaListEditor({
  idPrefix,
  heading,
  helperText,
  endpoint,
  initialItems,
  questionLabelPrefix,
  addLabel,
  removeLabel,
}: {
  idPrefix: string;
  heading: string;
  helperText: string;
  endpoint: string;
  initialItems: FaqItem[];
  questionLabelPrefix: string;
  addLabel: string;
  removeLabel: string;
}) {
  const [items, setItems] = useState<FaqItem[]>(initialItems);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function updateItem(index: number, patch: Partial<FaqItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [...current, { question: "", answer: "" }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
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
      setItems((current) => moveItemTo(current, dragIndex, index));
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

    // Drop entries the admin left fully blank (e.g. an added-then-abandoned
    // question) instead of forcing them to either fill it in or delete it.
    const trimmed = items
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question !== "" || item.answer !== "");

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: trimmed }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }
    setItems(trimmed);
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
      <h2 className="text-lg font-semibold text-ink-900">{heading}</h2>
      <p className="text-xs text-ink-700">{helperText}</p>

      <div className="space-y-3">
        {items.map((item, index) => (
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
                id={`${idPrefix}-question-${index}`}
                label={`${questionLabelPrefix} №${index + 1}`}
                value={item.question}
                onChange={(event) => updateItem(index, { question: event.target.value })}
              />
              <TextareaField
                id={`${idPrefix}-answer-${index}`}
                label="Отговор"
                value={item.answer}
                onChange={(event) => updateItem(index, { answer: event.target.value })}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-left text-sm text-ink-700 underline underline-offset-4"
              >
                {removeLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className={`${inputClasses} w-full text-center text-sm font-medium text-burgundy-700`}
      >
        {addLabel}
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
