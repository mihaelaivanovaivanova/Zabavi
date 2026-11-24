import { describe, expect, it } from "vitest";
import { product } from "@/config/site";

describe("illustrationsSectionService", () => {
  it("returns the config defaults when nothing has been saved yet", async () => {
    const { getIllustrationsSectionContent } = await import(
      "@/infrastructure/content/illustrationsSectionService"
    );

    const content = await getIllustrationsSectionContent();

    expect(content.heading).toBe(product.illustrationsSection.heading);
    expect(content.items[0]).toEqual({
      title: product.illustrations[0].title,
      description: product.illustrations[0].description,
    });
  });

  it("persists an admin edit, including clearing a description to hide it", async () => {
    const { getIllustrationsSectionContent, saveIllustrationsSectionContent } = await import(
      "@/infrastructure/content/illustrationsSectionService"
    );

    const current = await getIllustrationsSectionContent();
    const updated = {
      ...current,
      heading: "Нашите четири скици",
      items: current.items.map((item, index) => (index === 0 ? { ...item, description: "" } : item)),
    };

    await saveIllustrationsSectionContent(updated);

    const reloaded = await getIllustrationsSectionContent();
    expect(reloaded.heading).toBe("Нашите четири скици");
    expect(reloaded.items[0].description).toBe("");
  });
});
