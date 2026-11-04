import type { PaymentMethodId, PaymentProvider } from "@/domain/payment/types";
import { CashOnDeliveryProvider } from "@/infrastructure/payments/mock/cashOnDeliveryProvider";
import { MyPosStubProvider } from "@/infrastructure/payments/mock/myPosStubProvider";

const providers: Record<PaymentMethodId, PaymentProvider> = {
  card_mypos: new MyPosStubProvider(),
  cash_on_delivery: new CashOnDeliveryProvider(),
};

export function getPaymentProvider(method: PaymentMethodId): PaymentProvider {
  return providers[method];
}
