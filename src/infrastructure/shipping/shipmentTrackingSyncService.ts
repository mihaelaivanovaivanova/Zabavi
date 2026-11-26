import type { OrderDraft } from "@/domain/order/types";
import { transitionOrderStatus } from "@/domain/order/orderStatusService";
import { isSpeedyDeliveryMethod, shipmentStatusLabel, type ShipmentStatus } from "@/domain/shipping/types";
import { trackSpeedyShipment } from "@/infrastructure/shipping/speedyApiClient";
import { trackBoxNowParcel } from "@/infrastructure/shipping/boxNowApiClient";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";

/**
 * Ports smisul.bg's `ShipmentTrackingSyncService`: periodically polls every
 * in-flight shipment's live status and keeps the order's own status in
 * step with it. Carrier-agnostic — covers Speedy and BOX NOW identically in
 * the same pass. Before this, a shipment's status sat frozen at whatever it
 * was when the label was first created.
 *
 * Scoped to orders currently sitting at `shipped` or `returned` — an order
 * that hasn't reached `shipped` yet has nothing useful to poll for, and
 * `delivered`/`cancelled`/`refunded`/`failed` are terminal. `returned` stays
 * in scope (unlike those terminal ones) so a shipment stuck there can still
 * self-correct to `delivered` once a later poll genuinely confirms it — but
 * only within `RETURNED_POLLING_WINDOW_DAYS`, same as smisul.bg: a parcel
 * returned this long ago is never coming back as a late delivery, and every
 * further poll is just a wasted carrier call.
 */
const RETURNED_POLLING_WINDOW_DAYS = 10;

function isEligibleForSync(order: OrderDraft): boolean {
  if (!order.trackingNumber) return false;
  if (order.status === "shipped") return true;

  if (order.status === "returned") {
    const returnedEntry = [...order.statusHistory].reverse().find((entry) => entry.status === "returned");
    if (!returnedEntry) return false;
    const ageMs = Date.now() - new Date(returnedEntry.occurredAt).getTime();
    return ageMs <= RETURNED_POLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  }

  return false;
}

interface TrackingResult {
  currentStatus: ShipmentStatus;
}

async function trackOrderShipment(order: OrderDraft): Promise<TrackingResult | null> {
  if (!order.trackingNumber) return null;
  if (isSpeedyDeliveryMethod(order.shippingDetails.method)) {
    return trackSpeedyShipment(order.trackingNumber);
  }
  return trackBoxNowParcel(order.trackingNumber);
}

export interface ShipmentSyncResult {
  checked: number;
  updated: number;
  ordersUpdated: number;
  failed: number;
}

/**
 * The only move out of `returned` here is to `delivered`, on a genuine
 * later confirmation — deliberately never back to `shipped`. Re-confirms
 * the order is still sitting at `shipped`/`returned` right before
 * transitioning (something else may have moved it since this function's
 * own eligibility scan ran).
 */
async function advanceOrderStatus(order: OrderDraft, shipmentStatus: ShipmentStatus): Promise<boolean> {
  if (order.status !== "shipped" && order.status !== "returned") return false;

  const target = shipmentStatus === "delivered" ? "delivered" : shipmentStatus === "returned" ? "returned" : null;
  if (target === null || target === order.status) return false;

  await transitionOrderStatus(order, target, `Обновено от проследяване на пратката: ${shipmentStatusLabel(shipmentStatus)}`);
  return true;
}

export async function syncShipmentTracking(): Promise<ShipmentSyncResult> {
  const orders = (await orderRepository.findAll()).filter(isEligibleForSync);

  let checked = 0;
  let updated = 0;
  let ordersUpdated = 0;
  let failed = 0;

  for (const order of orders) {
    checked++;
    const previousStatus = order.shipmentStatus;

    let result: TrackingResult | null;
    try {
      result = await trackOrderShipment(order);
    } catch (error) {
      failed++;
      console.error("Shipment tracking sync failed.", {
        orderId: order.id,
        carrier: order.shippingDetails.method,
        trackingNumber: order.trackingNumber,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (!result) continue;

    if (result.currentStatus !== previousStatus) {
      updated++;
      order.shipmentStatus = result.currentStatus;
      order.shipmentEvents = [
        ...(order.shipmentEvents ?? []),
        { event: shipmentStatusLabel(result.currentStatus), parcelId: order.trackingNumber, occurredAt: new Date().toISOString() },
      ];
      await orderRepository.save(order);
    }

    try {
      if (await advanceOrderStatus(order, result.currentStatus)) {
        ordersUpdated++;
      }
    } catch (error) {
      failed++;
      console.error("Order status transition from tracking sync failed.", {
        orderId: order.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { checked, updated, ordersUpdated, failed };
}
