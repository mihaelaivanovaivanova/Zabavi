interface LogoProps {
  className?: string;
  /**
   * wordmark: horizontal, single line — default, for light backgrounds (header/footer).
   * stacked: two-line square mark, for light backgrounds (compact/square contexts).
   * stacked-light: two-line square mark in light lavender, for dark/burgundy backgrounds.
   * lockup: wordmark combined with the "II" symbol.
   * mark: the standalone "II" symbol only (favicon-style, small sizes).
   * badge: circular seal with the full wordmark — social avatars, stamps.
   */
  variant?: "wordmark" | "stacked" | "stacked-light" | "lockup" | "mark" | "badge";
}

const sources: Record<Required<LogoProps>["variant"], { src: string; width: number; height: number }> = {
  wordmark: { src: "/brand/zabavi-wordmark.svg", width: 1983, height: 793 },
  stacked: { src: "/brand/zabavi-wordmark-stacked.svg", width: 1254, height: 1254 },
  "stacked-light": { src: "/brand/zabavi-wordmark-stacked-light.svg", width: 1254, height: 1254 },
  lockup: { src: "/brand/zabavi-lockup.svg", width: 2048, height: 682 },
  mark: { src: "/brand/zabavi-mark.svg", width: 1254, height: 1254 },
  badge: { src: "/brand/zabavi-badge.svg", width: 1254, height: 1254 },
};

export function Logo({ className = "", variant = "wordmark" }: LogoProps) {
  const { src, width, height } = sources[variant];

  // eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster
  return <img src={src} alt="ЗАБАВЍ" width={width} height={height} className={`h-8 w-auto ${className}`} />;
}
