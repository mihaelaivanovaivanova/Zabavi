import type { OrderDraft } from "@/domain/order/types";
import type {
  PaymentAttemptResult,
  PaymentNotificationResult,
  PaymentProvider,
} from "@/domain/payment/types";

/**
 * Phase 1 stand-in for the production myPOS integration. It never contacts
 * myPOS, never handles real credentials and always returns a demo result.
 * Phase 2 replaces this with a real client built against the official
 * myPOS integration documentation, including signature-verified
 * notifications and idempotent processing.
 */
export class MyPosStubProvider implements PaymentProvider {
  readonly method = "card_mypos" as const;

  async createPayment(_order: OrderDraft): Promise<PaymentAttemptResult> {
    return {
      status: "pending",
      demoNotice:
        "ДЕМО: тук в продукция потребителят би бил пренасочен към хоствана страница на myPOS за плащане с карта. Няма извършено реално плащане.",
    };
  }

  async verifyNotification(): Promise<PaymentNotificationResult> {
    return { verified: false, alreadyProcessed: false };
  }
}
