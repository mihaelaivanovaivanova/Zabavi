import { describe, expect, it } from "vitest";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import type { Product } from "@/domain/product/types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    slug: "test-product",
    name: "Test product",
    tagline: "",
    description: "",
    heroImage: { label: "", alt: "" },
    boxContents: [],
    illustrations: [],
    variants: [],
    priceBgn: 10,
    currency: "BGN",
    ...overrides,
  };
}

describe("calculateTotals", () => {
  it("returns unconfirmed totals for an empty cart", () => {
    const result = calculateTotals([]);
    expect(result).toEqual({ subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false });
  });

  it("returns unconfirmed totals when the product price is still TBD", () => {
    const lookup = () => makeProduct({ priceBgn: null });
    const result = calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 1 }], lookup);
    expect(result.isPriceConfirmed).toBe(false);
    expect(result.totalBgn).toBeNull();
  });

  it("returns unconfirmed totals when the product cannot be found", () => {
    const lookup = () => undefined;
    const result = calculateTotals([{ productSlug: "missing", variantId: "standard", quantity: 1 }], lookup);
    expect(result.isPriceConfirmed).toBe(false);
  });

  it("multiplies price by quantity and never trusts a client-supplied price", () => {
    const lookup = () => makeProduct({ priceBgn: 25 });
    const result = calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 3 }], lookup);
    expect(result).toEqual({ subtotalBgn: 75, shippingBgn: 0, totalBgn: 75, isPriceConfirmed: true });
  });
});
