import { describe, expect, it } from "vitest";
import { defaultBoxNowMarketingContent } from "@/domain/content/types";

describe("boxNowMarketingService", () => {
  it("returns the defaults when nothing has been saved yet", async () => {
    const { getBoxNowMarketingContent } = await import("@/infrastructure/content/boxNowMarketingService");

    const content = await getBoxNowMarketingContent();

    expect(content).toEqual(defaultBoxNowMarketingContent());
  });

  it("persists an admin edit, including hiding the banner and badge", async () => {
    const { getBoxNowMarketingContent, saveBoxNowMarketingContent } = await import(
      "@/infrastructure/content/boxNowMarketingService"
    );

    await saveBoxNowMarketingContent({ bannerEnabled: false, badgeEnabled: false, bannerMessage: "Нова оферта" });

    const reloaded = await getBoxNowMarketingContent();
    expect(reloaded).toEqual({ bannerEnabled: false, badgeEnabled: false, bannerMessage: "Нова оферта" });
  });
});
