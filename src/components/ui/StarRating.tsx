interface StarRatingProps {
  /** Rating out of 5. */
  value: number;
  /** Number of real reviews behind the rating. Omit (or 0) to hide the count — never show a fabricated number. */
  count?: number;
  /** Tailwind size classes for each star. Defaults to a compact size. */
  starClassName?: string;
}

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`${className} ${filled ? "fill-accent-500" : "fill-lavender-200"}`}>
      <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.67.99-5.77L1.62 7.59l5.79-.84L10 1.5z" />
    </svg>
  );
}

export function StarRating({ value, count, starClassName = "h-4 w-4" }: StarRatingProps) {
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
