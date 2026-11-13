export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-lavender-300 bg-paper-50">
      <button
        type="button"
        aria-label="Намали количеството"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-ink-800 transition-colors hover:bg-lavender-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold text-ink-900" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Увеличи количеството"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-ink-800 transition-colors hover:bg-lavender-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
