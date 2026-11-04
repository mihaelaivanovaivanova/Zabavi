import type { OrderDraft } from "@/domain/order/types";
import type {
  PaymentAttemptResult,
  PaymentNotificationResult,
  PaymentProvider,
} from "@/domain/payment/types";

/**
 * Phase 1 stand-in for the production iCard integration. It never contacts
 * iCard, never handles real credentials and always returns a demo result.
 * Phase 2 replaces this with a real client built against the official
 * iCard integration documentation, including signature-verified
 * notifications and idempotent processing.
 */
export class ICardStubProvider implements PaymentProvider {
  readonly method = "card_icard" as const;

  async createPayment(_order: OrderDraft): Promise<PaymentAttemptResult> {
    return {
      status: "pending",
      demoNotice:
        "ДЕМО: тук в продукция потребителят би бил пренасочен към хоствана страница на iCard за плащане с карта. Няма извършено реално плащане.",
    };
  }

  async verifyNotification(): Promise<PaymentNotificationResult> {
    return { verified: false, alreadyProcessed: false };
  }
}
