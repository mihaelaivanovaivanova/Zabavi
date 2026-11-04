import type { OrderDraft } from "@/domain/order/types";
import type {
  PaymentAttemptResult,
  PaymentNotificationResult,
  PaymentProvider,
} from "@/domain/payment/types";

export class CashOnDeliveryProvider implements PaymentProvider {
  readonly method = "cash_on_delivery" as const;

  async createPayment(_order: OrderDraft): Promise<PaymentAttemptResult> {
    return {
      status: "pending",
      demoNotice: "ДЕМО: поръчката би била маркирана за плащане в брой при доставка.",
    };
  }

  async verifyNotification(): Promise<PaymentNotificationResult> {
    return { verified: true, alreadyProcessed: false };
  }
}
