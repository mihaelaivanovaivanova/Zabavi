/** Returns a copy of `items` with the element at `from` moved to position `to`; a no-op copy for out-of-range indexes. */
export function moveItemTo<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Clamps a focal-point coordinate to the valid 0-100 percentage range. */
export function clampFocalPercent(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, value));
}
