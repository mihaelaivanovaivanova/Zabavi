import type { CartLineItem } from "@/domain/cart/types";
import type { PaymentMethodId, PaymentStatus } from "@/domain/payment/types";
import type { ShipmentStatus, ShippingDetails } from "@/domain/shipping/types";

/**
 * Ported from smisul.bg's `OrderStatus` enum, minus `Pending` (an order is
 * created directly into `awaiting_payment`/`confirmed` — see checkout/route.ts)
 * and the two statuses smisul.bg itself retired (`Processing`/`Completed`).
 * `orderStatusService.ts` is the single place that validates/performs every
 * move between these — nothing else should ever write `status` directly.
 */
export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled"
  | "refunded"
  | "failed";

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

/** One entry in an order's append-only status timeline — see `orderStatusService.ts`. */
export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  previousStatus: OrderStatus | null;
  note: string | null;
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
  /** Customer requested an invoice at checkout — shown in the admin dashboard; `sendOrderInvoiceEmail` still fires on every `delivered` order regardless, same as before this flag existed. */
  wantsInvoice?: boolean;
  giftMessage?: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  /** Separate from `status`: an order can be "confirmed" while payment is still "pending" (cash on delivery). */
  paymentStatus?: PaymentStatus;
  /** Computed once at checkout time from `calculateTotals` — `null` while the kit's price is still TBD. */
  totalEur: number | null;
  /** The same figures broken out, snapshotted once at checkout so the detail page never re-derives a value that could drift if a kit's price changes later. */
  totalsSnapshot?: { subtotalEur: number | null; shippingEur: number | null; codFeeEur: number | null };
  /** The live carrier's own reference (BOX NOW `referenceNumber` / Speedy tracking id) — set only when a real shipment was created, never for the demo stub. */
  trackingNumber?: string;
  /** Carrier-level shipment status, distinct from the order's own `status` — see `ShipmentStatus`'s own doc comment. Updated by the tracking-sync service and the admin cancel-shipment action. */
  shipmentStatus?: ShipmentStatus;
  /** Populated from BOX NOW's parcel-tracking webhook, and from both carriers' tracking-sync polls, once a real shipment exists. */
  shipmentEvents?: ShipmentTrackingEvent[];
  /** Append-only audit trail of every status change — see `orderStatusService.ts`. */
  statusHistory: OrderStatusHistoryEntry[];
  createdAt: string;
}
