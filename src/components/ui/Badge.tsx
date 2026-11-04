import type { ReactNode } from "react";

export function Badge({ children, tone = "demo" }: { children: ReactNode; tone?: "demo" | "neutral" }) {
  const toneClasses =
    tone === "demo"
      ? "bg-accent-400/15 text-accent-600 border-accent-400/40"
      : "bg-sage-100 text-sage-700 border-sage-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${toneClasses}`}>
      {children}
    </span>
  );
}
