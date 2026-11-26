import { describe, expect, it } from "vitest";
import { BoxNowApiProvider } from "@/infrastructure/shipping/boxNowApiProvider";
import type { OrderDraft } from "@/domain/order/types";

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "box_now", lockerId: "LOCKER-42", addressLine1: "ул. Тест 5", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "awaiting_payment",
    totalEur: 25.5,
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("BoxNowApiProvider", () => {
  it("refuses to create a real shipment while the product price is still TBD", async () => {
    const provider = new BoxNowApiProvider();
    await expect(provider.createShipment(makeOrder())).rejects.toThrow(/истинска цена/i);
  });

  it("refuses to run against non-BOX NOW shipping details", async () => {
    const provider = new BoxNowApiProvider();
    const order = makeOrder({ shippingDetails: { method: "courier", address: "ул. 1", city: "София", postalCode: "1000" } });
    await expect(provider.createShipment(order)).rejects.toThrow(/non-BOX NOW/);
  });
});
