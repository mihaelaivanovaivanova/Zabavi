"use client";

interface StarRatingProps {
  /** Rating out of 5. */
  value: number;
  /** Number of real reviews behind the rating. Omit (or 0) to hide the count — never show a fabricated number. */
  count?: number;
  /** Tailwind size classes for each star. Defaults to a compact size. */
  starClassName?: string;
  /** Makes the stars clickable (a rating picker) instead of a read-only display. Omit for the original display-only behavior. */
  onChange?: (next: number) => void;
}

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`${className} ${filled ? "fill-accent-500" : "fill-lavender-200"}`}>
      <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.67.99-5.77L1.62 7.59l5.79-.84L10 1.5z" />
    </svg>
  );
}

export function StarRating({ value, count, starClassName = "h-4 w-4", onChange }: StarRatingProps) {
  if (onChange) {
    return (
      <div className="flex gap-1" role="radiogroup" aria-label="Оценка от 1 до 5 звезди">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} звезди`}
              onClick={() => onChange(starValue)}
              className="cursor-pointer"
            >
              <Star filled={index < value} className={starClassName} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex" role="img" aria-label={`Рейтинг ${value} от 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} filled={index < Math.round(value)} className={starClassName} />
        ))}
      </div>
      {count ? <span className="text-sm text-ink-700">{count} отзива</span> : null}
    </div>
  );
}
