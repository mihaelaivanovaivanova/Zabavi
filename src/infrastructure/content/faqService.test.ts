import { describe, expect, it } from "vitest";
import { faq } from "@/config/site";

describe("faqService", () => {
  it("returns the config defaults when nothing has been saved yet", async () => {
    const { getFaqContent } = await import("@/infrastructure/content/faqService");

    const content = await getFaqContent();

    expect(content.items).toEqual(faq);
  });

  it("persists an admin edit, including clearing the list down to a single item", async () => {
    const { getFaqContent, saveFaqContent } = await import("@/infrastructure/content/faqService");

    const updated = { items: [{ question: "Само един въпрос?", answer: "Да, само един." }] };
    await saveFaqContent(updated);

    const reloaded = await getFaqContent();
    expect(reloaded).toEqual(updated);
  });
});
