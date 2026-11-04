import type { PaymentMethodId, PaymentProvider } from "@/domain/payment/types";
import { CashOnDeliveryProvider } from "@/infrastructure/payments/mock/cashOnDeliveryProvider";
import { ICardStubProvider } from "@/infrastructure/payments/mock/iCardStubProvider";

const providers: Record<PaymentMethodId, PaymentProvider> = {
  card_icard: new ICardStubProvider(),
  cash_on_delivery: new CashOnDeliveryProvider(),
};

export function getPaymentProvider(method: PaymentMethodId): PaymentProvider {
  return providers[method];
}
