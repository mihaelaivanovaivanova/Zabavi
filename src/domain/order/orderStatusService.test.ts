import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDraft } from "@/domain/order/types";

const saveMock = vi.fn();
const createShipmentMock = vi.fn();
const getShippingProviderMock = vi.fn();
const sendOrderConfirmationEmailMock = vi.fn();
const sendAdminOrderNotificationEmailMock = vi.fn();
const sendOrderCancelledEmailMock = vi.fn();
const sendOrderDeliveredEmailMock = vi.fn();
const sendOrderInvoiceEmailMock = vi.fn();

vi.mock("@/infrastructure/repositories/orderRepository", () => ({
  orderRepository: { save: saveMock },
}));
vi.mock("@/infrastructure/shipping/getShippingProvider", () => ({
  getShippingProvider: getShippingProviderMock,
}));
vi.mock("@/infrastructure/email/orderEmails", () => ({
  sendOrderConfirmationEmail: sendOrderConfirmationEmailMock,
  sendAdminOrderNotificationEmail: sendAdminOrderNotificationEmailMock,
  sendOrderCancelledEmail: sendOrderCancelledEmailMock,
  sendOrderDeliveredEmail: sendOrderDeliveredEmailMock,
  sendOrderInvoiceEmail: sendOrderInvoiceEmailMock,
}));

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "awaiting_payment",
    totalEur: 25.5,
    statusHistory: [{ status: "awaiting_payment", previousStatus: null, note: null, occurredAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  saveMock.mockReset();
  createShipmentMock.mockReset();
  getShippingProviderMock.mockReset().mockResolvedValue({ createShipment: createShipmentMock });
  sendOrderConfirmationEmailMock.mockReset().mockResolvedValue(undefined);
  sendAdminOrderNotificationEmailMock.mockReset().mockResolvedValue(undefined);
  sendOrderCancelledEmailMock.mockReset().mockResolvedValue(undefined);
  sendOrderDeliveredEmailMock.mockReset().mockResolvedValue(undefined);
  sendOrderInvoiceEmailMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("transitionOrderStatus", () => {
  it("rejects a move not in the allowed-transitions table", async () => {
    const { transitionOrderStatus, InvalidOrderStatusTransitionError } = await import(
      "@/domain/order/orderStatusService"
    );
    const order = makeOrder({ status: "delivered" });

    await expect(transitionOrderStatus(order, "awaiting_payment", null)).rejects.toThrow(
      InvalidOrderStatusTransitionError,
    );
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("appends a status-history entry and persists the order", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    createShipmentMock.mockResolvedValue({ isLive: false, notice: "demo" });
    const order = makeOrder();

    await transitionOrderStatus(order, "confirmed", "Избран е наложен платеж.");

    expect(order.status).toBe("confirmed");
    expect(order.statusHistory).toHaveLength(2);
    expect(order.statusHistory[1]).toMatchObject({ status: "confirmed", previousStatus: "awaiting_payment", note: "Избран е наложен платеж." });
    expect(saveMock).toHaveBeenCalledWith(order);
  });

  it("creates the shipment and sends confirmation + admin emails on confirmed", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    createShipmentMock.mockResolvedValue({ isLive: true, notice: "live", referenceNumber: "REF-1" });
    const order = makeOrder();

    const { shipmentResult } = await transitionOrderStatus(order, "confirmed", null);

    expect(shipmentResult).toEqual({ isLive: true, notice: "live", referenceNumber: "REF-1" });
    expect(order.trackingNumber).toBe("REF-1");
    expect(order.shipmentStatus).toBe("accepted");
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalledWith(order);
    expect(sendAdminOrderNotificationEmailMock).toHaveBeenCalledWith(order);
  });

  it("does not recreate a shipment when one already exists", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    const order = makeOrder({ status: "paid", trackingNumber: "EXISTING" });

    await transitionOrderStatus(order, "packed", null);

    expect(createShipmentMock).not.toHaveBeenCalled();
  });

  it("swallows a shipment-creation failure instead of blocking the transition", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    createShipmentMock.mockRejectedValue(new Error("Speedy is down"));
    const order = makeOrder();

    const { shipmentResult } = await transitionOrderStatus(order, "confirmed", null);

    expect(shipmentResult).toBeNull();
    expect(order.status).toBe("confirmed");
    expect(saveMock).toHaveBeenCalledWith(order);
    expect(sendOrderConfirmationEmailMock).toHaveBeenCalled();
  });

  it("swallows an email failure instead of throwing", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    createShipmentMock.mockResolvedValue({ isLive: false, notice: "demo" });
    sendOrderConfirmationEmailMock.mockRejectedValue(new Error("mail server down"));
    const order = makeOrder();

    await expect(transitionOrderStatus(order, "confirmed", null)).resolves.toBeDefined();
    expect(order.status).toBe("confirmed");
  });

  it("sends the cancelled email on cancelled but not on failed", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");

    await transitionOrderStatus(makeOrder(), "failed", null);
    expect(sendOrderCancelledEmailMock).not.toHaveBeenCalled();

    await transitionOrderStatus(makeOrder(), "cancelled", null);
    expect(sendOrderCancelledEmailMock).toHaveBeenCalledTimes(1);
  });

  it("sends the delivered + invoice emails on delivered", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");
    const order = makeOrder({ status: "shipped" });

    await transitionOrderStatus(order, "delivered", null);

    expect(sendOrderDeliveredEmailMock).toHaveBeenCalledWith(order);
    expect(sendOrderInvoiceEmailMock).toHaveBeenCalledWith(order);
  });

  it("sends nothing for packed/shipped/returned/refunded", async () => {
    const { transitionOrderStatus } = await import("@/domain/order/orderStatusService");

    await transitionOrderStatus(makeOrder({ status: "paid" }), "packed", null);
    await transitionOrderStatus(makeOrder({ status: "packed" }), "shipped", null);
    await transitionOrderStatus(makeOrder({ status: "shipped" }), "returned", null);
    await transitionOrderStatus(makeOrder({ status: "delivered" }), "refunded", null);

    expect(sendOrderConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendOrderCancelledEmailMock).not.toHaveBeenCalled();
    expect(sendOrderDeliveredEmailMock).not.toHaveBeenCalled();
  });
});

describe("allowedTransitions", () => {
  it("matches the ported smisul.bg adjacency table", async () => {
    const { allowedTransitions } = await import("@/domain/order/orderStatusService");
    expect(allowedTransitions("awaiting_payment")).toEqual(["paid", "confirmed", "failed", "cancelled"]);
    expect(allowedTransitions("refunded")).toEqual([]);
  });
});
