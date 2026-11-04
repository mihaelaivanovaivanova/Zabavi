import { describe, expect, it } from "vitest";
import { getShippingProvider } from "@/infrastructure/shipping/getShippingProvider";
import type { OrderDraft } from "@/domain/order/types";

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Примерна 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getShippingProvider", () => {
  it("resolves the courier stub provider", async () => {
    const provider = getShippingProvider("courier");
    expect(provider.method).toBe("courier");
    const result = await provider.createShipment(makeOrder());
    expect(result.demoNotice).toMatch(/ДЕМО/);
  });

  it("resolves the BOX NOW stub provider and references the real selected locker ID", async () => {
    const provider = getShippingProvider("box_now");
    expect(provider.method).toBe("box_now");
    const order = makeOrder({
      shippingDetails: { method: "box_now", lockerId: "LOCKER-42", addressLine1: "ул. Тест 5", postalCode: "1000" },
    });
    const result = await provider.createShipment(order);
    expect(result.demoNotice).toMatch(/ДЕМО/);
    expect(result.demoNotice).toContain("LOCKER-42");
  });
});
