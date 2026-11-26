import { describe, expect, it } from "vitest";
import { product } from "@/config/site";

describe("howItWorksService", () => {
  it("returns the config defaults when nothing has been saved yet", async () => {
    const { getHowItWorksContent } = await import("@/infrastructure/content/howItWorksService");

    const content = await getHowItWorksContent();

    expect(content.heading).toBe(product.howItWorksSection.heading);
    expect(content.steps).toEqual(product.howItWorksSection.steps);
  });

  it("persists an admin edit, including an added step", async () => {
    const { getHowItWorksContent, saveHowItWorksContent } = await import(
      "@/infrastructure/content/howItWorksService"
    );

    const current = await getHowItWorksContent();
    const updated = {
      heading: "Нов процес",
      steps: [...current.steps, { title: "Остави да изсъхне", description: "Изчакай 20 минути." }],
    };

    await saveHowItWorksContent(updated);

    const reloaded = await getHowItWorksContent();
    expect(reloaded.heading).toBe("Нов процес");
    expect(reloaded.steps).toHaveLength(current.steps.length + 1);
  });
});
