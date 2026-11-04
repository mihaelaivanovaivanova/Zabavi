import type { OrderDraft } from "@/domain/order/types";

export type PaymentMethodId = "card_mypos" | "cash_on_delivery";

/**
 * Deliberately separate from OrderStatus: an order can be "confirmed" while
 * its payment is still "pending" (cash on delivery) and the two must never
 * be conflated when the real myPOS integration lands in Phase 2.
 */
export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentAttemptResult {
  status: PaymentStatus;
  /** User-facing demo disclaimer; always shown next to any payment UI in this prototype. */
  demoNotice: string;
  redirectUrl?: string;
}

export interface PaymentNotificationResult {
  verified: boolean;
  alreadyProcessed: boolean;
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
