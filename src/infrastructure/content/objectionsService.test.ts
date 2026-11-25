import { describe, expect, it } from "vitest";
import { objections } from "@/config/site";

describe("objectionsService", () => {
  it("returns the config defaults when nothing has been saved yet", async () => {
    const { getObjectionsContent } = await import("@/infrastructure/content/objectionsService");

    const content = await getObjectionsContent();

    expect(content.items).toEqual(objections);
  });

  it("persists an admin edit, including clearing the list down to a single item", async () => {
    const { getObjectionsContent, saveObjectionsContent } = await import("@/infrastructure/content/objectionsService");

    const updated = { items: [{ question: "…само едно възражение?", answer: "Да, само едно." }] };
    await saveObjectionsContent(updated);

    const reloaded = await getObjectionsContent();
    expect(reloaded).toEqual(updated);
  });
});
