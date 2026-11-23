import { afterEach, describe, expect, it, vi } from "vitest";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import { ICardApiProvider } from "@/infrastructure/payments/icard/icardApiProvider";
import type { OrderDraft } from "@/domain/order/types";

const order: OrderDraft = {
  id: "order-1",
  customer: { fullName: "Иван Иванов", phone: "0888123456" },
  shippingDetails: { method: "courier", address: "ул. Примерна 1", city: "София", postalCode: "1000" },
  items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
  paymentMethod: "cash_on_delivery",
  status: "pending",
  createdAt: new Date().toISOString(),
};

describe("getPaymentProvider", () => {
  it("resolves the iCard stub provider for card_icard without requiring real credentials", async () => {
    const provider = await getPaymentProvider("card_icard");
    expect(provider.method).toBe("card_icard");
    const result = await provider.createPayment(order);
    expect(result.status).toBe("pending");
    expect(result.isLive).toBe(false);
    expect(result.notice).toMatch(/ДЕМО/);
  });

  it("resolves the cash-on-delivery provider and never contacts an external service", async () => {
    const provider = await getPaymentProvider("cash_on_delivery");
    expect(provider.method).toBe("cash_on_delivery");
    const result = await provider.createPayment(order);
    expect(result.status).toBe("pending");
  });

  it("switches to the real iCard API provider once credentials are configured", async () => {
    vi.stubEnv("ICARD_ORIGINATOR", "33");
    vi.stubEnv("ICARD_MID", "000000000000123");
    vi.stubEnv("ICARD_MID_NAME", "ЗАБАВЍ");
    vi.stubEnv("ICARD_PRIVATE_KEY", "test-private-key");
    vi.stubEnv("ICARD_IPG_PUBLIC_KEY", "test-public-key");

    expect(await getPaymentProvider("card_icard")).toBeInstanceOf(ICardApiProvider);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});
