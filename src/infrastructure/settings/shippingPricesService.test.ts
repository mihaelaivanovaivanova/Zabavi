import { describe, expect, it } from "vitest";

describe("shippingPricesService", () => {
  it("defaults every delivery method to free (0) when nothing is saved yet", async () => {
    const { getShippingPrices } = await import("@/infrastructure/settings/shippingPricesService");
    expect(await getShippingPrices()).toEqual({ box_now: 0, courier: 0, speedy_office: 0, speedy_locker: 0 });
  });

  it("persists an admin edit and reflects it in getShippingPriceFor", async () => {
    const { getShippingPrices, getShippingPriceFor, saveShippingPrices } = await import(
      "@/infrastructure/settings/shippingPricesService"
    );

    await saveShippingPrices({ box_now: 2.5, courier: 3.9, speedy_office: 1.5, speedy_locker: 1.5 });

    expect(await getShippingPrices()).toEqual({ box_now: 2.5, courier: 3.9, speedy_office: 1.5, speedy_locker: 1.5 });
    expect(await getShippingPriceFor("courier")).toBe(3.9);
  });
});
