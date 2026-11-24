import { describe, expect, it } from "vitest";
import { product } from "@/config/site";

describe("illustrationsSectionService", () => {
  it("returns the config defaults when nothing has been saved yet", async () => {
    const { getIllustrationsSectionContent } = await import(
      "@/infrastructure/content/illustrationsSectionService"
    );

    const content = await getIllustrationsSectionContent();

    expect(content.heading).toBe(product.illustrationsSection.heading);
    expect(content.intro).toBe(product.illustrationsSection.intro);
  });

  it("persists an admin edit, including clearing the intro to hide it", async () => {
    const { getIllustrationsSectionContent, saveIllustrationsSectionContent } = await import(
      "@/infrastructure/content/illustrationsSectionService"
    );

    const current = await getIllustrationsSectionContent();
    const updated = { ...current, heading: "Нашите четири скици", intro: "" };

    await saveIllustrationsSectionContent(updated);

    const reloaded = await getIllustrationsSectionContent();
    expect(reloaded.heading).toBe("Нашите четири скици");
    expect(reloaded.intro).toBe("");
  });
});
