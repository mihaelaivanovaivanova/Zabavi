import type { OrderDraft } from "@/domain/order/types";

export type PaymentMethodId = "card_icard" | "cash_on_delivery";

/**
 * Deliberately separate from OrderStatus: an order can be "confirmed" while
 * its payment is still "pending" (cash on delivery) and the two must never
 * be conflated when the real iCard integration lands in Phase 2.
 */
export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentAttemptResult {
  status: PaymentStatus;
  /** True once a real payment provider created a live attempt; false for the demo/stub path. */
  isLive: boolean;
  /** User-facing notice: the demo disclaimer, or real guidance (e.g. "complete payment below"). */
  notice: string;
  redirectUrl?: string;
  /** iCard payment widget token: embed it client-side instead of redirecting. Only set when isLive is true. */
  widgetToken?: string;
}

export interface PaymentNotificationResult {
  verified: boolean;
  alreadyProcessed: boolean;
  orderId?: string;
  status?: PaymentStatus;
}

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
  isDemo: boolean;
}

export interface PaymentProvider {
  method: PaymentMethodId;
  createPayment(order: OrderDraft): Promise<PaymentAttemptResult>;
  verifyNotification(
    payload: unknown,
    signature: string,
  ): Promise<PaymentNotificationResult>;
}

/**
 * Thrown by a live payment provider when a payment attempt genuinely cannot
 * be created (missing configuration, unconfirmed pricing, missing required
 * customer data, upstream API failure). Callers must surface this as an
 * error response — never catch it and fall back to a fabricated success.
 */
export class PaymentProviderError extends Error {}
