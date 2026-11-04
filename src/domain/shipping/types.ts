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
  demoNotice: string;
}

export interface ShippingProvider {
  method: DeliveryMethodId;
  createShipment(order: OrderDraft): Promise<ShipmentCreationResult>;
}
