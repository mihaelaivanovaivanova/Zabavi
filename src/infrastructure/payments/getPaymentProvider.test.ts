import { describe, expect, it } from "vitest";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import type { OrderDraft } from "@/domain/order/types";

const order: OrderDraft = {
  id: "order-1",
  customer: { fullName: "Иван Иванов", phone: "0888123456" },
  shippingAddress: { address: "ул. Примерна 1", city: "София", postalCode: "1000" },
  deliveryMethod: "courier",
  items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
  paymentMethod: "cash_on_delivery",
  status: "pending",
  createdAt: new Date().toISOString(),
};

describe("getPaymentProvider", () => {
  it("resolves the myPOS stub provider for card_mypos without requiring real credentials", async () => {
    const provider = getPaymentProvider("card_mypos");
    expect(provider.method).toBe("card_mypos");
    const result = await provider.createPayment(order);
    expect(result.status).toBe("pending");
    expect(result.demoNotice).toMatch(/ДЕМО/);
  });

  it("resolves the cash-on-delivery provider and never contacts an external service", async () => {
    const provider = getPaymentProvider("cash_on_delivery");
    expect(provider.method).toBe("cash_on_delivery");
    const result = await provider.createPayment(order);
    expect(result.status).toBe("pending");
  });
});
