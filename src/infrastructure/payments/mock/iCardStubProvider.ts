import type { OrderDraft } from "@/domain/order/types";
import type {
  PaymentAttemptResult,
  PaymentNotificationResult,
  PaymentProvider,
} from "@/domain/payment/types";

/**
 * Fallback used whenever the real iCard IPG integration isn't configured
 * yet (no RSA keys/MID/Originator — see `icard/icardApiClient.ts`). Once
 * configured, `getPaymentProvider` returns `ICardApiProvider` instead,
 * which actually requests a payment widget token from iCard.
 */
export class ICardStubProvider implements PaymentProvider {
  readonly method = "card_icard" as const;

  async createPayment(_order: OrderDraft): Promise<PaymentAttemptResult> {
    return {
      status: "pending",
      isLive: false,
      notice:
        "ДЕМО: тук в продукция потребителят би видял вграден формуляр на iCard за плащане с карта. Няма извършено реално плащане.",
    };
  }

  async verifyNotification(): Promise<PaymentNotificationResult> {
    return { verified: false, alreadyProcessed: false };
  }
}
