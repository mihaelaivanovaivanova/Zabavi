import type { OrderDraft, OrderStatus } from "@/domain/order/types";
import { ShippingProviderError, type ShipmentCreationResult } from "@/domain/shipping/types";
import { createOrderShipment } from "@/infrastructure/shipping/carrierActions";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import {
  sendAdminOrderNotificationEmail,
  sendOrderCancelledEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendOrderInvoiceEmail,
} from "@/infrastructure/email/orderEmails";

/**
 * Ported from smisul.bg's `OrderStatusService::TRANSITIONS`, minus the
 * `Pending`/`Processing`/`Completed` statuses Zabavi doesn't use — see
 * `OrderStatus`'s own doc comment in `@/domain/order/types`.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ["paid", "confirmed", "failed", "cancelled"],
  paid: ["packed", "refunded", "cancelled"],
  confirmed: ["packed", "refunded", "cancelled"],
  packed: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "returned", "refunded"],
  returned: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
  failed: ["awaiting_payment", "paid", "confirmed", "cancelled"],
};

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from];
}

export class InvalidOrderStatusTransitionError extends Error {}

/**
 * Creates the real carrier shipment the moment an order is ready to
 * fulfill — ports smisul.bg's `CreateShipmentOnOrderPaid` listener.
 * Deliberately swallows every failure (network, carrier rejection,
 * missing config): a shipping outage must never undo an order that's
 * already paid/confirmed. A later admin retry is the intended recovery
 * path, same as smisul.bg's own docblock for this.
 */
async function createShipmentIfNeeded(order: OrderDraft): Promise<ShipmentCreationResult | null> {
  if (order.trackingNumber) return null;

  try {
    const result = await createOrderShipment(order);
    if (result.isLive && result.referenceNumber) {
      order.trackingNumber = result.referenceNumber;
      order.shipmentStatus = "accepted";
      order.shipmentEvents = [
        ...(order.shipmentEvents ?? []),
        { event: "Заявена пратка", parcelId: result.referenceNumber, occurredAt: new Date().toISOString() },
      ];
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Automatic shipment creation failed after order confirmation.", {
      orderId: order.id,
      carrier: order.shippingDetails.method,
      message,
    });
    if (error instanceof ShippingProviderError) return null;
    // Still never rethrow — any other failure (network, unexpected shape)
    // must be just as non-fatal to the order transition as a typed one.
    return null;
  }
}

/** A mail transport failure must never roll back a status transition that already happened. */
async function safeSend(send: () => Promise<void>): Promise<void> {
  try {
    await send();
  } catch (error) {
    console.error("Order status email failed to send.", error instanceof Error ? error.message : error);
  }
}

/**
 * Ports smisul.bg's `SendOrderStatusEmails` trigger logic: only the
 * transitions a customer/the store actually cares about send anything.
 * `packed`/`shipped`/`returned`/`refunded` are deliberately silent, same as
 * `packed`→`shipped` being silent there (the confirmation email already
 * covers "we got your order").
 */
async function dispatchSideEffects(order: OrderDraft, to: OrderStatus): Promise<ShipmentCreationResult | null> {
  if (to === "paid" || to === "confirmed") {
    const shipmentResult = await createShipmentIfNeeded(order);
    await safeSend(() => sendOrderConfirmationEmail(order));
    await safeSend(() => sendAdminOrderNotificationEmail(order));
    return shipmentResult;
  }

  if (to === "cancelled") {
    // Not sent for "failed" — a failed card payment can still be retried,
    // so it would be premature (and alarming) to tell the customer their
    // order was cancelled. Matches smisul.bg exactly.
    await safeSend(() => sendOrderCancelledEmail(order));
    return null;
  }

  if (to === "delivered") {
    await safeSend(() => sendOrderDeliveredEmail(order));
    await safeSend(() => sendOrderInvoiceEmail(order));
  }

  return null;
}

/**
 * The single place every order status change goes through — checkout,
 * the iCard webhook, the shipment-tracking sync, and the admin status
 * update all call this; nothing else should ever write `order.status`
 * directly. Mirrors smisul.bg's `OrderStatusService::transitionTo()`.
 */
export async function transitionOrderStatus(
  order: OrderDraft,
  to: OrderStatus,
  note: string | null,
): Promise<{ order: OrderDraft; shipmentResult: ShipmentCreationResult | null }> {
  const from = order.status;

  if (!allowedTransitions(from).includes(to)) {
    throw new InvalidOrderStatusTransitionError(
      `Поръчка ${order.orderNumber ?? order.id} не може да премине от „${from}“ към „${to}“.`,
    );
  }

  order.statusHistory = [...order.statusHistory, { status: to, previousStatus: from, note, occurredAt: new Date().toISOString() }];
  order.status = to;

  const shipmentResult = await dispatchSideEffects(order, to);

  await orderRepository.save(order);

  return { order, shipmentResult };
}
