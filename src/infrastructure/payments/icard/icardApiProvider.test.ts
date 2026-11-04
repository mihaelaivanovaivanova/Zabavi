import { describe, expect, it } from "vitest";
import { ICardApiProvider } from "@/infrastructure/payments/icard/icardApiProvider";
import type { OrderDraft } from "@/domain/order/types";

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456", email: "ivan@example.bg" },
    customerIp: "82.119.81.30",
    billingAddress: { address: "ул. Примерна 1", city: "София", postalCode: "1000" },
    shippingDetails: { method: "courier", address: "ул. Примерна 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "card_icard",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("ICardApiProvider", () => {
  it("refuses to create a real payment attempt while the product price is still TBD", async () => {
    const provider = new ICardApiProvider();
    await expect(provider.createPayment(makeOrder())).rejects.toThrow(/истинска цена/i);
  });
});
