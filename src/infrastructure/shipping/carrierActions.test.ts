import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDraft } from "@/domain/order/types";

const fetchSpeedyLabelMock = vi.fn();
const cancelSpeedyShipmentMock = vi.fn();
const fetchBoxNowLabelMock = vi.fn();
const cancelBoxNowParcelMock = vi.fn();
const getShippingProviderMock = vi.fn();

vi.mock("@/infrastructure/shipping/speedyApiClient", () => ({
  fetchSpeedyLabel: fetchSpeedyLabelMock,
  cancelSpeedyShipment: cancelSpeedyShipmentMock,
}));
vi.mock("@/infrastructure/shipping/boxNowApiClient", () => ({
  fetchBoxNowLabel: fetchBoxNowLabelMock,
  cancelBoxNowParcel: cancelBoxNowParcelMock,
}));
vi.mock("@/infrastructure/shipping/getShippingProvider", () => ({
  getShippingProvider: getShippingProviderMock,
}));

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    totalEur: 25.5,
    trackingNumber: "TRACK-1",
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  fetchSpeedyLabelMock.mockReset();
  cancelSpeedyShipmentMock.mockReset();
  fetchBoxNowLabelMock.mockReset();
  cancelBoxNowParcelMock.mockReset();
  getShippingProviderMock.mockReset();
});

describe("fetchOrderShipmentLabel", () => {
  it("routes a courier order to Speedy", async () => {
    fetchSpeedyLabelMock.mockResolvedValue(new ArrayBuffer(1));
    const { fetchOrderShipmentLabel } = await import("@/infrastructure/shipping/carrierActions");

    await fetchOrderShipmentLabel(makeOrder());

    expect(fetchSpeedyLabelMock).toHaveBeenCalledWith("TRACK-1");
    expect(fetchBoxNowLabelMock).not.toHaveBeenCalled();
  });

  it("routes a box_now order to BOX NOW", async () => {
    fetchBoxNowLabelMock.mockResolvedValue(new ArrayBuffer(1));
    const { fetchOrderShipmentLabel } = await import("@/infrastructure/shipping/carrierActions");

    await fetchOrderShipmentLabel(
      makeOrder({ shippingDetails: { method: "box_now", lockerId: "L-1", addressLine1: "ул. 1", postalCode: "1000" } }),
    );

    expect(fetchBoxNowLabelMock).toHaveBeenCalledWith("TRACK-1");
    expect(fetchSpeedyLabelMock).not.toHaveBeenCalled();
  });

  it("refuses an order with no tracking number", async () => {
    const { fetchOrderShipmentLabel } = await import("@/infrastructure/shipping/carrierActions");
    await expect(fetchOrderShipmentLabel(makeOrder({ trackingNumber: undefined }))).rejects.toThrow(/няма заявена пратка/);
  });
});

describe("cancelOrderShipment", () => {
  it("routes a courier order's cancel to Speedy with the reason", async () => {
    const { cancelOrderShipment } = await import("@/infrastructure/shipping/carrierActions");
    await cancelOrderShipment(makeOrder(), "Грешен адрес");
    expect(cancelSpeedyShipmentMock).toHaveBeenCalledWith("TRACK-1", "Грешен адрес");
  });

  it("routes a box_now order's cancel to BOX NOW", async () => {
    const { cancelOrderShipment } = await import("@/infrastructure/shipping/carrierActions");
    await cancelOrderShipment(
      makeOrder({ shippingDetails: { method: "box_now", lockerId: "L-1", addressLine1: "ул. 1", postalCode: "1000" } }),
    );
    expect(cancelBoxNowParcelMock).toHaveBeenCalledWith("TRACK-1", undefined);
  });
});

describe("createOrderShipment", () => {
  it("creates a shipment through whichever provider getShippingProvider resolves for the order's method", async () => {
    const createShipment = vi.fn().mockResolvedValue({ isLive: true, notice: "Заявена.", referenceNumber: "NEW-TRACK" });
    getShippingProviderMock.mockResolvedValue({ method: "courier", createShipment });
    const { createOrderShipment } = await import("@/infrastructure/shipping/carrierActions");

    const order = makeOrder({ trackingNumber: undefined });
    const result = await createOrderShipment(order);

    expect(getShippingProviderMock).toHaveBeenCalledWith("courier");
    expect(createShipment).toHaveBeenCalledWith(order);
    expect(result).toEqual({ isLive: true, notice: "Заявена.", referenceNumber: "NEW-TRACK" });
  });

  it("lets the provider's failure propagate instead of swallowing it", async () => {
    const { ShippingProviderError } = await import("@/domain/shipping/types");
    const createShipment = vi.fn().mockRejectedValue(new ShippingProviderError("Speedy credentials are not configured."));
    getShippingProviderMock.mockResolvedValue({ method: "courier", createShipment });
    const { createOrderShipment } = await import("@/infrastructure/shipping/carrierActions");

    await expect(createOrderShipment(makeOrder({ trackingNumber: undefined }))).rejects.toThrow(
      "Speedy credentials are not configured.",
    );
  });
});
