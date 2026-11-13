import type { CartLineItem } from "@/domain/cart/types";
import type { PaymentMethodId, PaymentStatus } from "@/domain/payment/types";
import type { ShippingDetails } from "@/domain/shipping/types";

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
}

/**
 * One BOX NOW parcel-tracking webhook event, stored as received. `event` is
 * BOX NOW's raw event name (e.g. "New", "Delivered", "Cancelled") — see
 * `api/webhooks/boxnow/route.ts`. Kept as an append-only log so the full
 * tracking history survives, not just the latest state.
 */
export interface ShipmentTrackingEvent {
  event: string;
  parcelId?: string;
  /** From the webhook's `data.time` — when BOX NOW recorded the event, not when we received it. */
  occurredAt: string;
}

export interface OrderDraft {
  id: string;
  /** Short, human-readable order reference (e.g. "ZB-261113-A4F2"), shown in the admin dashboard. `id` (UUID) remains the real primary key. */
  orderNumber?: string;
  customer: OrderCustomer;
  /** Captured server-side from the request at checkout time; iCard's IPGPurchase requires it. Never client-submitted. */
  customerIp?: string;
  /** Billing address, distinct from `shippingDetails` — required by iCard regardless of delivery method. */
  billingAddress?: { address: string; city: string; postalCode: string };
  shippingDetails: ShippingDetails;
  giftMessage?: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  /** Separate from `status`: an order can be "confirmed" while payment is still "pending" (cash on delivery). */
  paymentStatus?: PaymentStatus;
  /** Populated from BOX NOW's parcel-tracking webhook once a BOX NOW shipment exists. */
  shipmentEvents?: ShipmentTrackingEvent[];
  createdAt: string;
}
