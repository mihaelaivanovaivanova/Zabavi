export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-lavender-200 bg-paper-50 p-5">
      <p className="text-sm text-ink-700">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-700">{hint}</p> : null}
    </div>
  );
}
