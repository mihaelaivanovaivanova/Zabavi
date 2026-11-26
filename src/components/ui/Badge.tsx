import type { ReactNode } from "react";

export type BadgeTone = "demo" | "neutral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  demo: "bg-accent-400/15 text-accent-600 border-accent-400/40",
  neutral: "bg-sage-100 text-sage-700 border-sage-300",
  success: "bg-sage-100 text-sage-700 border-sage-300",
  warning: "bg-accent-400/15 text-accent-600 border-accent-400/40",
  danger: "bg-burgundy-100 text-burgundy-700 border-burgundy-300",
};

export function Badge({ children, tone = "demo" }: { children: ReactNode; tone?: BadgeTone }) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${toneClasses}`}>
      {children}
    </span>
  );
}
