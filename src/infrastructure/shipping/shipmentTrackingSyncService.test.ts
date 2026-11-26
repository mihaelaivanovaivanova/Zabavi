import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDraft } from "@/domain/order/types";

const findAllMock = vi.fn<() => Promise<OrderDraft[]>>();
const saveMock = vi.fn();
const trackSpeedyShipmentMock = vi.fn();
const trackBoxNowParcelMock = vi.fn();
const transitionOrderStatusMock = vi.fn();

vi.mock("@/infrastructure/repositories/orderRepository", () => ({
  orderRepository: { findAll: findAllMock, save: saveMock },
}));
vi.mock("@/infrastructure/shipping/speedyApiClient", () => ({
  trackSpeedyShipment: trackSpeedyShipmentMock,
}));
vi.mock("@/infrastructure/shipping/boxNowApiClient", () => ({
  trackBoxNowParcel: trackBoxNowParcelMock,
}));
vi.mock("@/domain/order/orderStatusService", () => ({
  transitionOrderStatus: transitionOrderStatusMock,
}));

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    totalEur: 25.5,
    trackingNumber: "TRACK-1",
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  findAllMock.mockReset();
  saveMock.mockReset();
  trackSpeedyShipmentMock.mockReset();
  trackBoxNowParcelMock.mockReset();
  transitionOrderStatusMock.mockReset().mockResolvedValue({ order: {}, shipmentResult: null });
});

describe("syncShipmentTracking", () => {
  it("only polls orders sitting at shipped/returned with a tracking number", async () => {
    findAllMock.mockResolvedValue([
      makeOrder({ id: "a", status: "confirmed" }),
      makeOrder({ id: "b", status: "shipped", trackingNumber: undefined }),
      makeOrder({ id: "c", status: "shipped" }),
    ]);
    trackSpeedyShipmentMock.mockResolvedValue({ currentStatus: "in_transit" });

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    const result = await syncShipmentTracking();

    expect(result.checked).toBe(1);
    expect(trackSpeedyShipmentMock).toHaveBeenCalledWith("TRACK-1");
  });

  it("routes to BOX NOW's tracker for a box_now order", async () => {
    findAllMock.mockResolvedValue([
      makeOrder({ shippingDetails: { method: "box_now", lockerId: "L-1", addressLine1: "ул. 1", postalCode: "1000" } }),
    ]);
    trackBoxNowParcelMock.mockResolvedValue({ currentStatus: "in_transit" });

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    await syncShipmentTracking();

    expect(trackBoxNowParcelMock).toHaveBeenCalledWith("TRACK-1");
    expect(trackSpeedyShipmentMock).not.toHaveBeenCalled();
  });

  it("advances a shipped order to delivered when the carrier reports it", async () => {
    const order = makeOrder({ status: "shipped" });
    findAllMock.mockResolvedValue([order]);
    trackSpeedyShipmentMock.mockResolvedValue({ currentStatus: "delivered" });

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    const result = await syncShipmentTracking();

    expect(transitionOrderStatusMock).toHaveBeenCalledWith(order, "delivered", expect.any(String));
    expect(result.ordersUpdated).toBe(1);
    expect(order.shipmentStatus).toBe("delivered");
  });

  it("never moves a returned order back to shipped", async () => {
    const order = makeOrder({
      status: "returned",
      statusHistory: [{ status: "returned", previousStatus: "shipped", note: null, occurredAt: new Date().toISOString() }],
    });
    findAllMock.mockResolvedValue([order]);
    trackSpeedyShipmentMock.mockResolvedValue({ currentStatus: "in_transit" });

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    const result = await syncShipmentTracking();

    expect(transitionOrderStatusMock).not.toHaveBeenCalled();
    expect(result.ordersUpdated).toBe(0);
  });

  it("stops polling a returned order once it's outside the 10-day window", async () => {
    const order = makeOrder({
      status: "returned",
      statusHistory: [
        { status: "returned", previousStatus: "shipped", note: null, occurredAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() },
      ],
    });
    findAllMock.mockResolvedValue([order]);

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    const result = await syncShipmentTracking();

    expect(result.checked).toBe(0);
    expect(trackSpeedyShipmentMock).not.toHaveBeenCalled();
  });

  it("logs and counts a tracking failure without throwing", async () => {
    findAllMock.mockResolvedValue([makeOrder()]);
    trackSpeedyShipmentMock.mockRejectedValue(new Error("Speedy track failed"));

    const { syncShipmentTracking } = await import("@/infrastructure/shipping/shipmentTrackingSyncService");
    const result = await syncShipmentTracking();

    expect(result.failed).toBe(1);
    expect(result.ordersUpdated).toBe(0);
  });
});
