import { describe, expect, it, vi } from "vitest";
import { SpeedyApiProvider } from "@/infrastructure/shipping/speedyApiProvider";
import type { OrderDraft } from "@/domain/order/types";

const createSpeedyShipmentMock = vi.fn().mockResolvedValue({ trackingNumber: "TRACK-1" });
vi.mock("@/infrastructure/shipping/speedyApiClient", () => ({
  createSpeedyShipment: (...args: unknown[]) => createSpeedyShipmentMock(...args),
}));

vi.mock("@/domain/cart/calculateTotals", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domain/cart/calculateTotals")>();
  return { calculateTotals: vi.fn(actual.calculateTotals) };
});
import { calculateTotals } from "@/domain/cart/calculateTotals";

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 5", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "awaiting_payment",
    totalEur: 25.5,
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("SpeedyApiProvider", () => {
  it("refuses to create a real shipment while the product price is still TBD", async () => {
    const provider = new SpeedyApiProvider();
    await expect(provider.createShipment(makeOrder())).rejects.toThrow(/истинска цена/i);
  });

  it("refuses to run against a non-Speedy shipping method", async () => {
    const provider = new SpeedyApiProvider();
    const order = makeOrder({
      shippingDetails: { method: "box_now", lockerId: "LOCKER-1", addressLine1: "ул. 1", postalCode: "1000" },
    });
    await expect(provider.createShipment(order)).rejects.toThrow(/non-Speedy/);
  });

  it("runs the same TBD-price guard for a Speedy office destination as for an address one", async () => {
    // The office-vs-address request shape itself is covered by
    // speedyApiClient.test.ts; this just confirms office/locker orders
    // aren't accidentally skipping the shared price-confirmation guard.
    const order = makeOrder({ shippingDetails: { method: "speedy_office", officeId: "4567", officeLabel: "София", city: "София" } });
    await expect(new SpeedyApiProvider().createShipment(order)).rejects.toThrow(/истинска цена/i);
  });

  it("sends the short human-readable orderNumber as Speedy's ref1, not the raw UUID id", async () => {
    // Speedy's ref1 field is capped at 30 characters — a raw order.id
    // (a full UUID) is rejected live ("Реф1: Максималната позволена
    // дължина е 30"); order.orderNumber ("ZB-261127-A4F2") fits.
    createSpeedyShipmentMock.mockClear();
    vi.mocked(calculateTotals).mockResolvedValueOnce({
      subtotalEur: 25.5,
      shippingEur: 0,
      codFeeEur: 0,
      totalEur: 25.5,
      isPriceConfirmed: true,
    });
    const order = makeOrder({ id: "8554f301-4077-4539-8097-f61931db3b28", orderNumber: "ZB-261127-A4F2" });

    await new SpeedyApiProvider().createShipment(order);

    expect(createSpeedyShipmentMock).toHaveBeenCalledWith(expect.objectContaining({ orderNumber: "ZB-261127-A4F2" }));
  });
});
