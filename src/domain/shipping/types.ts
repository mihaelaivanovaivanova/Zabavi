import type { OrderDraft } from "@/domain/order/types";

export type DeliveryMethodId = "courier" | "box_now";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  /** false renders the option as "coming soon" and disables selection. */
  available: boolean;
}

export interface CourierShippingDetails {
  method: "courier";
  address: string;
  city: string;
  postalCode: string;
}

/**
 * A locker selected through BOX NOW's public map widget. The widget talks
 * directly to BOX NOW's production location data — the locker (id, address,
 * postal code) is real. Only the shipment creation call that would follow
 * in production (`POST /api/v1/delivery-requests`) is not performed here.
 */
export interface BoxNowShippingDetails {
  method: "box_now";
  lockerId: string;
  addressLine1: string;
  postalCode: string;
}

export type ShippingDetails = CourierShippingDetails | BoxNowShippingDetails;

export interface ShipmentCreationResult {
  /** True once a real carrier API created the shipment; false for the demo/stub path. */
  isLive: boolean;
  /** User-facing notice: the demo disclaimer, or a confirmation referencing the real carrier response. */
  notice: string;
  /** Carrier's reference number for the created delivery request. Only set when isLive is true. */
  referenceNumber?: string;
  parcelIds?: string[];
}

export interface ShippingProvider {
  method: DeliveryMethodId;
  createShipment(order: OrderDraft): Promise<ShipmentCreationResult>;
}

/**
 * Thrown by a live shipping provider when a shipment genuinely cannot be
 * created (missing configuration, unconfirmed pricing, upstream API
 * failure). Callers must surface this as an error response — never catch
 * it and fall back to a fabricated success notice.
 */
export class ShippingProviderError extends Error {}

/**
 * Carrier-level shipment lifecycle, normalized across Speedy/BOX NOW —
 * ported verbatim (incl. Bulgarian labels) from smisul.bg's `ShipmentStatus`
 * enum. Distinct from `OrderStatus`: this is what a single tracking call
 * reports right now; `shipmentTrackingSyncService.ts` is the only thing
 * that turns a change here into an `OrderStatus` transition, and only for
 * orders already sitting at `shipped`/`returned` — see its own doc comment.
 */
export type ShipmentStatus =
  | "pending"
  | "accepted"
  | "prepared"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "delivered"
  | "returned"
  | "failed"
  | "cancelled";

const FINAL_SHIPMENT_STATUSES: ReadonlySet<ShipmentStatus> = new Set(["delivered", "returned", "failed", "cancelled"]);

/** Once true, a tracking poll never needs to keep checking this shipment (except `returned`'s own short grace window — see the sync service). */
export function isFinalShipmentStatus(status: ShipmentStatus): boolean {
  return FINAL_SHIPMENT_STATUSES.has(status);
}

/**
 * Whether this status, once observed, should win as "the real current
 * status" over whatever a carrier's API reports chronologically after it —
 * see `SpeedyShippingProvider::track()`'s ported `mostAdvancedStatus` logic
 * in `speedyApiClient.ts` for the real case this exists for (a trailing
 * unmapped post-delivery operation must never hide a real Delivered).
 */
export function isStickyShipmentStatus(status: ShipmentStatus): boolean {
  return FINAL_SHIPMENT_STATUSES.has(status);
}

const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Изчаква обработка",
  accepted: "Приета от куриера",
  prepared: "Подготвена за изпращане",
  picked_up: "Взета от куриера",
  in_transit: "В транзит",
  out_for_delivery: "За доставка",
  ready_for_pickup: "Готова за получаване",
  delivered: "Доставена",
  returned: "Върната",
  failed: "Неуспешна доставка",
  cancelled: "Анулирана",
};

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status];
}
