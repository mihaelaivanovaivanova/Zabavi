import { describe, expect, it } from "vitest";
import { calculateTotals } from "@/domain/cart/calculateTotals";

describe("calculateTotals", () => {
  it("returns unconfirmed totals for an empty cart", async () => {
    const result = await calculateTotals([]);
    expect(result).toEqual({ subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false });
  });

  it("returns unconfirmed totals when the kit price is still TBD", async () => {
    const lookup = () => null;
    const result = await calculateTotals(
      [{ productSlug: "test-product", variantId: "standard", quantity: 1 }],
      lookup,
    );
    expect(result.isPriceConfirmed).toBe(false);
    expect(result.totalBgn).toBeNull();
  });

  it("returns unconfirmed totals when the product cannot be found", async () => {
    const lookup = () => null;
    const result = await calculateTotals([{ productSlug: "missing", variantId: "standard", quantity: 1 }], lookup);
    expect(result.isPriceConfirmed).toBe(false);
  });

  it("multiplies price by quantity and never trusts a client-supplied price", async () => {
    const lookup = () => 25;
    const result = await calculateTotals(
      [{ productSlug: "test-product", variantId: "standard", quantity: 3 }],
      lookup,
    );
    expect(result).toEqual({ subtotalBgn: 75, shippingBgn: 0, totalBgn: 75, isPriceConfirmed: true });
  });
});
