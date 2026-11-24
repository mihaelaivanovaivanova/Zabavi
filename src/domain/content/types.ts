import { product } from "@/config/site";

export interface IllustrationSectionItem {
  title: string;
  /** Empty string hides the description paragraph under this illustration's title on the landing page. */
  description: string;
}

/**
 * Admin-configurable copy for the "Четирите илюстрации" landing section —
 * set through /admin/settings. Unlike `KitDetails`, there's no per-field
 * null-fallback here: the admin form is always pre-filled with the current
 * resolved text (seeded from `product.illustrationsSection`/`product.illustrations`
 * on first load), so whatever it saves is the value to show, blank included.
 */
export interface IllustrationsSectionContent {
  heading: string;
  /** Empty string hides the paragraph under the section heading. */
  intro: string;
  items: IllustrationSectionItem[];
}

export function defaultIllustrationsSectionContent(): IllustrationsSectionContent {
  return {
    heading: product.illustrationsSection.heading,
    intro: product.illustrationsSection.intro,
    items: product.illustrations.map((illustration) => ({
      title: illustration.title,
      description: illustration.description,
    })),
  };
}

/**
 * Aligns a stored (or missing) content record with `product.illustrations`'
 * current length, so a config change that adds/removes an illustration
 * doesn't break the admin form or the landing page.
 */
export function normalizeIllustrationsSectionContent(
  content: IllustrationsSectionContent | null,
): IllustrationsSectionContent {
  const defaults = defaultIllustrationsSectionContent();
  if (!content) return defaults;
  return {
    heading: content.heading,
    intro: content.intro,
    items: defaults.items.map((fallback, index) => content.items[index] ?? fallback),
  };
}
