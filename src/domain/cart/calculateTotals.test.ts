import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import { saveShippingPrices } from "@/infrastructure/settings/shippingPricesService";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("calculateTotals", () => {
  it("returns unconfirmed totals for an empty cart", async () => {
    const result = await calculateTotals([]);
    expect(result).toEqual({ subtotalEur: null, shippingEur: null, codFeeEur: null, totalEur: null, isPriceConfirmed: false });
  });

  it("returns unconfirmed totals when the kit price is still TBD", async () => {
    const lookup = () => null;
    const result = await calculateTotals(
      [{ productSlug: "test-product", variantId: "standard", quantity: 1 }],
      { priceLookup: lookup },
    );
    expect(result.isPriceConfirmed).toBe(false);
    expect(result.totalEur).toBeNull();
  });

  it("returns unconfirmed totals when the product cannot be found", async () => {
    const lookup = () => null;
    const result = await calculateTotals([{ productSlug: "missing", variantId: "standard", quantity: 1 }], {
      priceLookup: lookup,
    });
    expect(result.isPriceConfirmed).toBe(false);
  });

  it("multiplies price by quantity and never trusts a client-supplied price", async () => {
    const lookup = () => 25;
    const result = await calculateTotals(
      [{ productSlug: "test-product", variantId: "standard", quantity: 3 }],
      { priceLookup: lookup },
    );
    expect(result).toEqual({ subtotalEur: 75, shippingEur: 0, codFeeEur: 0, totalEur: 75, isPriceConfirmed: true });
  });

  it("folds the cash-on-delivery fee into the total only for that payment method", async () => {
    vi.stubEnv("COD_FEE_EUR", "0.75");
    const lookup = () => 25;

    const cod = await calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 1 }], {
      priceLookup: lookup,
      paymentMethod: "cash_on_delivery",
    });
    expect(cod).toEqual({ subtotalEur: 25, shippingEur: 0, codFeeEur: 0.75, totalEur: 25.75, isPriceConfirmed: true });

    const card = await calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 1 }], {
      priceLookup: lookup,
      paymentMethod: "card_icard",
    });
    expect(card).toEqual({ subtotalEur: 25, shippingEur: 0, codFeeEur: 0, totalEur: 25, isPriceConfirmed: true });
  });

  it("looks up the admin-configured shipping price for the given delivery method", async () => {
    await saveShippingPrices({ box_now: 2.5, courier: 0, speedy_office: 1.2, speedy_locker: 1.2 });
    const lookup = () => 25;

    const boxNow = await calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 1 }], {
      priceLookup: lookup,
      deliveryMethod: "box_now",
    });
    expect(boxNow).toEqual({ subtotalEur: 25, shippingEur: 2.5, codFeeEur: 0, totalEur: 27.5, isPriceConfirmed: true });

    const courier = await calculateTotals([{ productSlug: "test-product", variantId: "standard", quantity: 1 }], {
      priceLookup: lookup,
      deliveryMethod: "courier",
    });
    expect(courier.shippingEur).toBe(0);
  });
});
