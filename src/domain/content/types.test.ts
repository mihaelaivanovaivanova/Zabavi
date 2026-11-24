import { describe, expect, it } from "vitest";
import { product } from "@/config/site";
import {
  defaultIllustrationsSectionContent,
  normalizeIllustrationsSectionContent,
} from "@/domain/content/types";

describe("defaultIllustrationsSectionContent", () => {
  it("seeds heading, intro and per-illustration title/description from the site config", () => {
    const defaults = defaultIllustrationsSectionContent();
    expect(defaults.heading).toBe(product.illustrationsSection.heading);
    expect(defaults.intro).toBe(product.illustrationsSection.intro);
    expect(defaults.items).toEqual(
      product.illustrations.map((illustration) => ({
        title: illustration.title,
        description: illustration.description,
      })),
    );
  });
});

describe("normalizeIllustrationsSectionContent", () => {
  it("falls back to the full config default when nothing is stored", () => {
    expect(normalizeIllustrationsSectionContent(null)).toEqual(defaultIllustrationsSectionContent());
  });

  it("keeps the admin-saved heading, intro and items as-is, including an explicitly empty description", () => {
    const stored = {
      heading: "Нов текст",
      intro: "",
      items: product.illustrations.map((illustration, index) => ({
        title: `Заглавие ${index}`,
        description: index === 0 ? "" : illustration.description,
      })),
    };

    expect(normalizeIllustrationsSectionContent(stored)).toEqual(stored);
  });

  it("pads a stored items list that is shorter than the current illustration count with config defaults", () => {
    const defaults = defaultIllustrationsSectionContent();
    const stored = { heading: "Запазено заглавие", intro: "Запазен текст", items: [defaults.items[0]] };

    const normalized = normalizeIllustrationsSectionContent(stored);

    expect(normalized.heading).toBe("Запазено заглавие");
    expect(normalized.items[0]).toEqual(defaults.items[0]);
    expect(normalized.items[1]).toEqual(defaults.items[1]);
    expect(normalized.items).toHaveLength(defaults.items.length);
  });
});
