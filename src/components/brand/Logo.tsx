interface LogoProps {
  className?: string;
  tone?: "dark" | "light";
}

/**
 * Typographic placeholder wordmark until the official ЗАБАВЍ SVG logo is
 * supplied. Renders "И" and a separately colored combining grave accent
 * (U+0300) so the accent above the final letter stays orange, matching the
 * brand mark it stands in for. Swap for the real SVG in src/components/brand
 * once it is available — nothing else needs to change.
 */
export function Logo({ className = "", tone = "dark" }: LogoProps) {
  const textColor = tone === "dark" ? "text-ink-900" : "text-paper-50";

  return (
    <span className={`font-serif text-2xl font-semibold tracking-wide ${textColor} ${className}`}>
      ЗАБАВ
      <span className={textColor}>И</span>
      <span className="text-accent-500">{"̀"}</span>
    </span>
  );
}
