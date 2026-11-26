import { describe, expect, it } from "vitest";
import { faq, objections, product } from "@/config/site";
import {
  defaultBoxNowMarketingContent,
  defaultFaqContent,
  defaultHowItWorksContent,
  defaultIllustrationsSectionContent,
  defaultObjectionsContent,
  normalizeBoxNowMarketingContent,
  normalizeFaqContent,
  normalizeHowItWorksContent,
  normalizeIllustrationsSectionContent,
  normalizeObjectionsContent,
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

describe("defaultObjectionsContent", () => {
  it("seeds items from the site config", () => {
    expect(defaultObjectionsContent()).toEqual({ items: objections });
  });
});

describe("normalizeObjectionsContent", () => {
  it("falls back to the config default when nothing is stored", () => {
    expect(normalizeObjectionsContent(null)).toEqual(defaultObjectionsContent());
  });

  it("keeps the admin-saved items as-is, including an explicitly empty list", () => {
    expect(normalizeObjectionsContent({ items: [] })).toEqual({ items: [] });

    const stored = { items: [{ question: "…ново възражение?", answer: "Нов отговор." }] };
    expect(normalizeObjectionsContent(stored)).toEqual(stored);
  });
});

describe("defaultHowItWorksContent", () => {
  it("seeds heading and steps from the site config", () => {
    const defaults = defaultHowItWorksContent();
    expect(defaults.heading).toBe(product.howItWorksSection.heading);
    expect(defaults.steps).toEqual(product.howItWorksSection.steps);
  });
});

describe("normalizeHowItWorksContent", () => {
  it("falls back to the config default when nothing is stored", () => {
    expect(normalizeHowItWorksContent(null)).toEqual(defaultHowItWorksContent());
  });

  it("keeps the admin-saved heading and steps as-is, including an explicitly empty step list", () => {
    const stored = { heading: "Нов процес", steps: [] };
    expect(normalizeHowItWorksContent(stored)).toEqual(stored);
  });
});

describe("defaultBoxNowMarketingContent", () => {
  it("defaults both the banner and the badge to shown", () => {
    const defaults = defaultBoxNowMarketingContent();
    expect(defaults.bannerEnabled).toBe(true);
    expect(defaults.badgeEnabled).toBe(true);
    expect(defaults.bannerMessage).not.toBe("");
  });
});

describe("normalizeBoxNowMarketingContent", () => {
  it("falls back to the default when nothing is stored", () => {
    expect(normalizeBoxNowMarketingContent(null)).toEqual(defaultBoxNowMarketingContent());
  });

  it("keeps the admin-saved toggles and message as-is", () => {
    const stored = { bannerEnabled: false, badgeEnabled: false, bannerMessage: "Нов текст" };
    expect(normalizeBoxNowMarketingContent(stored)).toEqual(stored);
  });

  it("falls back to the default message only when it's genuinely empty", () => {
    const stored = { bannerEnabled: true, badgeEnabled: true, bannerMessage: "" };
    expect(normalizeBoxNowMarketingContent(stored).bannerMessage).toBe(defaultBoxNowMarketingContent().bannerMessage);
  });
});
