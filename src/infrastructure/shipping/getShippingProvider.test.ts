import { afterEach, describe, expect, it, vi } from "vitest";
import { getShippingProvider } from "@/infrastructure/shipping/getShippingProvider";
import { BoxNowApiProvider } from "@/infrastructure/shipping/boxNowApiProvider";
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
    expect(result.isLive).toBe(false);
    expect(result.notice).toMatch(/ДЕМО/);
  });

  it("resolves the BOX NOW stub provider and references the real selected locker ID when the API is not configured", async () => {
    const provider = getShippingProvider("box_now");
    expect(provider.method).toBe("box_now");
    const order = makeOrder({
      shippingDetails: { method: "box_now", lockerId: "LOCKER-42", addressLine1: "ул. Тест 5", postalCode: "1000" },
    });
    const result = await provider.createShipment(order);
    expect(result.isLive).toBe(false);
    expect(result.notice).toMatch(/ДЕМО/);
    expect(result.notice).toContain("LOCKER-42");
  });

  it("switches to the real BOX NOW API provider once credentials are configured", () => {
    vi.stubEnv("BOXNOW_API_URL", "https://partner-api.boxnow.bg");
    vi.stubEnv("BOXNOW_OAUTH_CLIENT_ID", "test-client-id");
    vi.stubEnv("BOXNOW_OAUTH_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("BOXNOW_ORIGIN_LOCATION_ID", "origin-location-1");
    vi.stubEnv("BOXNOW_ORIGIN_CONTACT_NAME", "ЗАБАВЍ Склад");
    vi.stubEnv("BOXNOW_ORIGIN_CONTACT_EMAIL", "warehouse@zabavi.example");
    vi.stubEnv("BOXNOW_ORIGIN_CONTACT_NUMBER", "+359888000000");

    expect(getShippingProvider("box_now")).toBeInstanceOf(BoxNowApiProvider);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});
