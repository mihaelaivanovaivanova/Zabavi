import { faq, product } from "@/config/site";

/**
 * Admin-configurable copy for the "Четирите илюстрации" landing section's
 * heading/intro — set through /admin/settings. The per-illustration
 * title/description live on `KitDetails.illustrationContent` instead (set
 * through /admin/kits), since each kit shows its own four illustrations.
 * Unlike `KitDetails`, there's no null-fallback here: the admin form is
 * always pre-filled with the current resolved text (seeded from
 * `product.illustrationsSection` on first load), so whatever it saves is the
 * value to show, blank included.
 */
export interface IllustrationsSectionContent {
  heading: string;
  /** Empty string hides the paragraph under the section heading. */
  intro: string;
}

export function defaultIllustrationsSectionContent(): IllustrationsSectionContent {
  return {
    heading: product.illustrationsSection.heading,
    intro: product.illustrationsSection.intro,
  };
}

export function normalizeIllustrationsSectionContent(
  content: IllustrationsSectionContent | null,
): IllustrationsSectionContent {
  if (!content) return defaultIllustrationsSectionContent();
  return { heading: content.heading, intro: content.intro };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Admin-configurable "Често задавани въпроси" list — set through
 * /admin/settings. Same always-pre-filled convention as
 * `IllustrationsSectionContent`: whatever is saved (including an empty
 * list) is the value to show, seeded from `faq` in `src/config/site.ts` on
 * first load.
 */
export interface FaqContent {
  items: FaqItem[];
}

export function defaultFaqContent(): FaqContent {
  return { items: faq.map((item) => ({ question: item.question, answer: item.answer })) };
}

export function normalizeFaqContent(content: FaqContent | null): FaqContent {
  if (!content) return defaultFaqContent();
  return { items: content.items.map((item) => ({ question: item.question, answer: item.answer })) };
}
