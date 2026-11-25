"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Field";
import { product } from "@/config/site";

type Step = "rating" | "comment" | "about" | "done";
type SubmitState = { status: "idle" } | { status: "submitting" } | { status: "error"; message: string };

export function ReviewWizardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [stepError, setStepError] = useState<string | null>(null);

  function reset() {
    setStep("rating");
    setRating(0);
    setBody("");
    setEmail("");
    setDisplayName("");
    setIsAnonymous(false);
    setSubmitState({ status: "idle" });
    setStepError(null);
  }

  function handleClose() {
    onClose();
    // Wait for the close transition-less unmount before clearing — this modal
    // has no exit animation, so resetting immediately is safe and avoids a
    // leftover filled-in form if the visitor reopens it.
    reset();
  }

  async function handleSubmit() {
    if (!email.trim() || !displayName.trim()) {
      setStepError("Имейл адресът и името за показване са задължителни.");
      return;
    }
    setStepError(null);
    setSubmitState({ status: "submitting" });

    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body, email, displayName, isAnonymous }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setSubmitState({ status: "error", message: data?.error ?? "Записът се провали." });
      return;
    }
    setSubmitState({ status: "idle" });
    setStep("done");
  }

  if (!isOpen) return null;

  return (
    <>
      <div aria-hidden="true" onClick={handleClose} className="fixed inset-0 z-40 bg-ink-900/40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-paper-50 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-ink-900">
              {step === "rating" && "Как бихте оценили този продукт?"}
              {step === "comment" && "Разкажи ни повече"}
              {step === "about" && "За вас"}
              {step === "done" && "Благодарим ти!"}
            </h2>
            <button type="button" onClick={handleClose} aria-label="Затвори" className="text-2xl leading-none text-ink-700 hover:text-ink-900">
              ×
            </button>
          </div>

          {step === "rating" ? (
            <div className="mt-4">
              <p className="text-ink-700">Ще се радваме, ако споделите малко за вашия опит.</p>
              <p className="mt-4 text-center text-sm font-medium text-ink-800">{product.name}</p>
              <div className="mt-4 flex justify-center">
                <StarRating value={rating} onChange={setRating} starClassName="h-9 w-9" />
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="button" disabled={rating === 0} onClick={() => setStep("comment")}>
                  Напред
                </Button>
              </div>
            </div>
          ) : null}

          {step === "comment" ? (
            <div className="mt-4">
              <TextareaField
                id="review-body"
                label="Отзив"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
              />
              <div className="mt-6 flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("rating")}>
                  Назад
                </Button>
                <Button
                  type="button"
                  disabled={body.trim() === ""}
                  onClick={() => setStep("about")}
                >
                  Напред
                </Button>
              </div>
            </div>
          ) : null}

          {step === "about" ? (
            <div className="mt-4 space-y-4">
              <p className="text-ink-700">Моля, кажете ни повече за вас.</p>
              <InputField
                id="review-email"
                type="email"
                label="Имейл адрес (Задължително)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Вашият имейл адрес"
              />
              <p className="-mt-2 text-xs text-ink-700">Ценим вашата поверителност.</p>
              <InputField
                id="review-display-name"
                label="Име за показване (Задължително)"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Име за показване"
              />
              <label className="flex items-center gap-2 text-sm text-ink-800">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  className="h-4 w-4 accent-burgundy-700"
                />
                Публикувайте отзив като анонимен
              </label>

              {stepError ? (
                <p role="alert" className="text-sm text-burgundy-600">
                  {stepError}
                </p>
              ) : null}
              {submitState.status === "error" ? (
                <p role="alert" className="text-sm text-burgundy-600">
                  {submitState.message}
                </p>
              ) : null}

              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("comment")}>
                  Назад
                </Button>
                <Button type="button" disabled={submitState.status === "submitting"} onClick={handleSubmit}>
                  {submitState.status === "submitting" ? "Изпращане…" : "Изпрати"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="mt-4">
              <p className="text-ink-700">Високо оценяваме твоята оценка!</p>
              <p className="mt-3 text-ink-700">
                Моля, потвърди коментара като кликнеш на линка в имейла, който ти изпратихме! ❤️
              </p>
              <div className="mt-6 flex justify-end">
                <Button type="button" onClick={handleClose}>
                  Затвори
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
