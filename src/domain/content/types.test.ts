import { describe, expect, it } from "vitest";
import { faq, product } from "@/config/site";
import {
  defaultFaqContent,
  defaultIllustrationsSectionContent,
  normalizeFaqContent,
  normalizeIllustrationsSectionContent,
} from "@/domain/content/types";

describe("defaultIllustrationsSectionContent", () => {
  it("seeds heading and intro from the site config", () => {
    const defaults = defaultIllustrationsSectionContent();
    expect(defaults.heading).toBe(product.illustrationsSection.heading);
    expect(defaults.intro).toBe(product.illustrationsSection.intro);
  });
});

describe("normalizeIllustrationsSectionContent", () => {
  it("falls back to the config default when nothing is stored", () => {
    expect(normalizeIllustrationsSectionContent(null)).toEqual(defaultIllustrationsSectionContent());
  });

  it("keeps the admin-saved heading and intro as-is, including an explicitly empty intro", () => {
    const stored = { heading: "Нов текст", intro: "" };

    expect(normalizeIllustrationsSectionContent(stored)).toEqual(stored);
  });
});

describe("defaultFaqContent", () => {
  it("seeds items from the site config", () => {
    expect(defaultFaqContent()).toEqual({ items: faq });
  });
});

describe("normalizeFaqContent", () => {
  it("falls back to the config default when nothing is stored", () => {
    expect(normalizeFaqContent(null)).toEqual(defaultFaqContent());
  });

  it("keeps the admin-saved items as-is, including an explicitly empty list", () => {
    expect(normalizeFaqContent({ items: [] })).toEqual({ items: [] });

    const stored = { items: [{ question: "Нов въпрос?", answer: "Нов отговор." }] };
    expect(normalizeFaqContent(stored)).toEqual(stored);
  });
});
