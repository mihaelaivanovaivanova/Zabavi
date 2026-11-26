import type { OrderDraft } from "@/domain/order/types";
import { ShippingProviderError, isSpeedyDeliveryMethod } from "@/domain/shipping/types";
import { cancelSpeedyShipment, fetchSpeedyLabel } from "@/infrastructure/shipping/speedyApiClient";
import { cancelBoxNowParcel, fetchBoxNowLabel } from "@/infrastructure/shipping/boxNowApiClient";

/** Dispatches the label/cancel actions to whichever carrier the order's own shipment uses — shared by the admin shipment routes. */

function requireTrackingNumber(order: OrderDraft): string {
  if (!order.trackingNumber) {
    throw new ShippingProviderError("Тази поръчка няма заявена пратка.");
  }
  return order.trackingNumber;
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
