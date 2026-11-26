import { faq, objections, product } from "@/config/site";

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

export interface HowItWorksStep {
  title: string;
  description: string;
}

/**
 * Admin-configurable copy for the "Как протича рисуването" landing
 * section's heading and numbered steps — set through /admin/settings. Same
 * always-pre-filled convention as `IllustrationsSectionContent`: whatever is
 * saved (including an empty step list) is the value to show, seeded from
 * `product.howItWorksSection` on first load.
 */
export interface HowItWorksContent {
  heading: string;
  steps: HowItWorksStep[];
}

export function defaultHowItWorksContent(): HowItWorksContent {
  return {
    heading: product.howItWorksSection.heading,
    steps: product.howItWorksSection.steps.map((step) => ({ ...step })),
  };
}

export function normalizeHowItWorksContent(content: HowItWorksContent | null): HowItWorksContent {
  if (!content) return defaultHowItWorksContent();
  return { heading: content.heading, steps: content.steps };
}

/**
 * Admin-configurable "BOX NOW marketing chrome" — the top announcement
 * banner (every page) and the homepage's floating BOX NOW badge, ported
 * from smisul.bg's `general.box_now_banner_enabled`/`box_now_badge_enabled`/
 * `box_now_banner_message` settings. Deliberately separate from
 * `BoxNowSettings` (API credentials) — "show this marketing copy" and
 * "shipments are live" are different concerns; this is purely storefront
 * chrome, shown even while BOX NOW itself still runs the demo stub.
 */
export interface BoxNowMarketingContent {
  bannerEnabled: boolean;
  badgeEnabled: boolean;
  bannerMessage: string;
}

export function defaultBoxNowMarketingContent(): BoxNowMarketingContent {
  return {
    bannerEnabled: true,
    badgeEnabled: true,
    bannerMessage: "Безплатна доставка с BOX NOW",
  };
}

export function normalizeBoxNowMarketingContent(
  content: BoxNowMarketingContent | null,
): BoxNowMarketingContent {
  if (!content) return defaultBoxNowMarketingContent();
  const defaults = defaultBoxNowMarketingContent();
  return {
    bannerEnabled: content.bannerEnabled ?? defaults.bannerEnabled,
    badgeEnabled: content.badgeEnabled ?? defaults.badgeEnabled,
    bannerMessage: content.bannerMessage || defaults.bannerMessage,
  };
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

/**
 * Admin-configurable "Ами ако…" objections list — set through
 * /admin/settings. Same convention as `FaqContent`, seeded from
 * `objections` in `src/config/site.ts` on first load.
 */
export interface ObjectionsContent {
  items: FaqItem[];
}

export function defaultObjectionsContent(): ObjectionsContent {
  return { items: objections.map((item) => ({ question: item.question, answer: item.answer })) };
}

export function normalizeObjectionsContent(content: ObjectionsContent | null): ObjectionsContent {
  if (!content) return defaultObjectionsContent();
  return { items: content.items.map((item) => ({ question: item.question, answer: item.answer })) };
}
