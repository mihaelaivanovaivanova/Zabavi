import { describe, expect, it } from "vitest";
import { product } from "@/config/site";
import {
  defaultIllustrationsSectionContent,
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
