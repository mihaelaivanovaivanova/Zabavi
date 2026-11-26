/**
 * Bulgarian "streamlined" Cyrillic->Latin transliteration (the scheme used
 * on road signs and in passports) — lets a search for "Sofia" match
 * "СОФИЯ" without needing a reverse (ambiguous) Latin->Cyrillic mapping.
 * Ported from smisul.bg's own SearchableSelect.tsx.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

function transliterate(text: string): string {
  return text
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

/**
 * Common English spellings of Bulgarian place names often drop the "y"
 * glide the strict transliteration above adds for я/ю (e.g. "София" ->
 * strict "sofiya", but everyone types/writes "Sofia") — this loose variant
 * covers that so the common spelling still matches.
 */
function looseTransliterate(text: string): string {
  return transliterate(text).replace(/y([auo])/g, "$1");
}

/** Matches `query` (typed in either Cyrillic or Latin) against `label` (BG text, normally Cyrillic). */
export function matchesBilingualQuery(label: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const normalizedLabel = label.toLowerCase();
  return (
    normalizedLabel.includes(normalizedQuery) ||
    transliterate(normalizedLabel).includes(normalizedQuery) ||
    looseTransliterate(normalizedLabel).includes(normalizedQuery)
  );
}
