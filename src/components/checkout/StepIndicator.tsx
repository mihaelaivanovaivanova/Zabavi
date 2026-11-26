const STEP_LABELS = ["Данни за поръчката", "Доставка и плащане", "Преглед", "Плащане"] as const;

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-4">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                isActive
                  ? "bg-burgundy-600 text-paper-50"
                  : isDone
                    ? "bg-sage-500 text-paper-50"
                    : "bg-lavender-100 text-ink-700"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {stepNumber}
            </span>
            <span className={`text-sm ${isActive ? "font-semibold text-ink-900" : "text-ink-700"}`}>{label}</span>
            {stepNumber < STEP_LABELS.length ? <span className="h-px w-4 bg-lavender-200 sm:w-8" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
