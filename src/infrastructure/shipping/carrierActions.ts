import type { OrderDraft } from "@/domain/order/types";
import { ShippingProviderError, isSpeedyDeliveryMethod, type ShipmentCreationResult } from "@/domain/shipping/types";
import { cancelSpeedyShipment, fetchSpeedyLabel } from "@/infrastructure/shipping/speedyApiClient";
import { cancelBoxNowParcel, fetchBoxNowLabel } from "@/infrastructure/shipping/boxNowApiClient";
import { getShippingProvider } from "@/infrastructure/shipping/getShippingProvider";

/** Dispatches the label/cancel/create actions to whichever carrier the order's own shipment uses — shared by the admin shipment routes. */

function requireTrackingNumber(order: OrderDraft): string {
  if (!order.trackingNumber) {
    throw new ShippingProviderError("Тази поръчка няма заявена пратка.");
  }
  return order.trackingNumber;
}

/**
 * Creates the real carrier shipment for an order — the one piece shared
 * with `orderStatusService.ts`'s own `createShipmentIfNeeded`, which calls
 * this but then swallows any failure (a shipping outage must never undo an
 * already-confirmed order). Callers that want to see *why* it failed — the
 * admin "Създай пратка" retry action — call this directly instead and let
 * the real error surface.
 */
export async function createOrderShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
  const provider = await getShippingProvider(order.shippingDetails.method);
  return provider.createShipment(order);
}

export async function fetchOrderShipmentLabel(order: OrderDraft): Promise<ArrayBuffer> {
  const trackingNumber = requireTrackingNumber(order);
  return isSpeedyDeliveryMethod(order.shippingDetails.method)
    ? fetchSpeedyLabel(trackingNumber)
    : fetchBoxNowLabel(trackingNumber);
}

export async function cancelOrderShipment(order: OrderDraft, reason?: string | null): Promise<void> {
  const trackingNumber = requireTrackingNumber(order);
  if (isSpeedyDeliveryMethod(order.shippingDetails.method)) {
    await cancelSpeedyShipment(trackingNumber, reason);
  } else {
    await cancelBoxNowParcel(trackingNumber, reason);
  }
}
