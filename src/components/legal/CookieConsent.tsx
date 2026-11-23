"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useCookieConsent, type CookiePreferences } from "@/lib/CookieConsentContext";

const categories: { key: keyof CookiePreferences; label: string; description: string }[] = [
  {
    key: "analytics",
    label: "Аналитични",
    description: "Биха ни помогнали да разберем как се използва Сайтът, чрез анонимизирана статистика.",
  },
  {
    key: "marketing",
    label: "Маркетингови",
    description: "Биха се използвали за показване на реклами, съобразени с интересите Ви.",
  },
  {
    key: "preferences",
    label: "Предпочитания",
    description: "Запомнят Вашите настройки на Сайта.",
  },
];

function CookieSettingsDialog({
  initialPreferences,
  onSave,
  onClose,
}: {
  initialPreferences: CookiePreferences;
  onSave: (prefs: CookiePreferences) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CookiePreferences>(initialPreferences);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Настройки на бисквитките"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-lg rounded-2xl bg-paper-50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink-900">Настройки на бисквитките</h2>
        <p className="mt-2 text-sm text-ink-700">
          Необходимите бисквитки осигуряват основната функционалност на Сайта и не могат да бъдат изключени.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-start justify-between gap-4 text-sm text-ink-700">
            <span>
              <span className="font-semibold text-ink-900">Необходими</span> — винаги активни.
            </span>
            <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-burgundy-700" />
          </label>

          {categories.map((category) => (
            <label key={category.key} className="flex items-start justify-between gap-4 text-sm text-ink-700">
              <span>
                <span className="font-semibold text-ink-900">{category.label}</span> — {category.description}
              </span>
              <input
                type="checkbox"
                checked={draft[category.key]}
                onChange={(event) => setDraft({ ...draft, [category.key]: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-burgundy-700"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="px-4 py-2">
            Затвори
          </Button>
          <Button type="button" variant="primary" onClick={() => onSave(draft)} className="px-4 py-2">
            Запази избора
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsent() {
  const { showBanner, isSettingsOpen, preferences, acceptAll, acceptNecessaryOnly, savePreferences, openSettings, closeSettings } =
    useCookieConsent();

  if (!showBanner && !isSettingsOpen) return null;

  return (
    <>
      {showBanner && !isSettingsOpen ? (
        <div
          role="region"
          aria-label="Настройки на бисквитките"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-lavender-200 bg-paper-50 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:p-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-700">
              Използваме бисквитки, за да осигурим правилната работа на Сайта. Можеш да приемеш всички бисквитки или
              да персонализираш избора си.{" "}
              <Link href="/privacy" className="text-burgundy-700 hover:underline">
                Политика за поверителност и бисквитки
              </Link>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={openSettings} className="px-4 py-2">
                Персонализирай
              </Button>
              <Button type="button" variant="secondary" onClick={acceptNecessaryOnly} className="px-4 py-2">
                Само необходими
              </Button>
              <Button type="button" variant="primary" onClick={acceptAll} className="px-4 py-2">
                Приеми всички
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <CookieSettingsDialog initialPreferences={preferences} onSave={savePreferences} onClose={closeSettings} />
      ) : null}
    </>
  );
}
