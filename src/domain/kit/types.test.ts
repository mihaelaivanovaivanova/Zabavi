import { describe, expect, it } from "vitest";
import { defaultKitDetails, resolveVariant } from "@/domain/kit/types";
import type { ProductVariant } from "@/domain/product/types";

const baseVariant: ProductVariant = {
  id: "christmas-magic",
  label: "Магията на Коледа",
  intro: "Коледа. Вълшебство.",
  badge: "Лимитирано",
  contents: ["4 картички", "2 четки"],
  bonus: ["4 мини принта"],
};

describe("resolveVariant", () => {
  it("falls back to the config variant when there is no saved kit", () => {
    expect(resolveVariant(baseVariant, undefined)).toEqual(baseVariant);
  });

  it("falls back to the config variant for fields the admin never customized", () => {
    const kit = defaultKitDetails(baseVariant.id);
    expect(resolveVariant(baseVariant, kit)).toEqual(baseVariant);
  });

  it("uses the admin-saved name, intro, badge and lists once customized", () => {
    const kit = {
      ...defaultKitDetails(baseVariant.id),
      label: "Зимна магия",
      intro: "Нов въвеждащ текст.",
      badge: "Ново",
      contents: ["1 нов елемент"],
      bonus: [],
    };

    expect(resolveVariant(baseVariant, kit)).toEqual({
      id: "christmas-magic",
      label: "Зимна магия",
      intro: "Нов въвеждащ текст.",
      badge: "Ново",
      contents: ["1 нов елемент"],
      bonus: [],
    });
  });

  it("treats an explicitly cleared list ([]) as the admin's choice, not as unset", () => {
    const kit = { ...defaultKitDetails(baseVariant.id), bonus: [] };
    expect(resolveVariant(baseVariant, kit).bonus).toEqual([]);
  });
});
