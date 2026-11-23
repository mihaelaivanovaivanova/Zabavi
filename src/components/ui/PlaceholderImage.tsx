interface PlaceholderImageProps {
  label: string;
  alt: string;
  aspect?: "square" | "portrait" | "wide" | "reel";
  className?: string;
}

const aspectClasses: Record<Required<PlaceholderImageProps>["aspect"], string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  reel: "aspect-[9/16]",
};

/**
 * Stands in for real product photography/illustration scans, which have
 * not been supplied yet. Swap for next/image once real assets exist.
 */
export function PlaceholderImage({ label, alt, aspect = "square", className = "" }: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`${aspectClasses[aspect]} flex items-center justify-center rounded-2xl border border-dashed border-lavender-300 bg-lavender-50 ${className}`}
    >
      <span className="px-4 text-center text-sm font-medium text-lavender-600">{label}</span>
    </div>
  );
}
