import type { PaymentMethodId, PaymentProvider } from "@/domain/payment/types";
import { isICardApiConfigured } from "@/infrastructure/payments/icard/icardApiClient";
import { ICardApiProvider } from "@/infrastructure/payments/icard/icardApiProvider";
import { CashOnDeliveryProvider } from "@/infrastructure/payments/mock/cashOnDeliveryProvider";
import { ICardStubProvider } from "@/infrastructure/payments/mock/iCardStubProvider";

const stubProviders: Record<PaymentMethodId, PaymentProvider> = {
  card_icard: new ICardStubProvider(),
  cash_on_delivery: new CashOnDeliveryProvider(),
};

/**
 * Returns the real iCard IPG provider once RSA keys/MID/Originator are
 * configured (see `icard/icardApiClient.ts`); otherwise the demo stub, so
 * checkout stays honest about what it can actually charge.
 */
export async function getPaymentProvider(method: PaymentMethodId): Promise<PaymentProvider> {
  if (method === "card_icard" && (await isICardApiConfigured())) {
    return new ICardApiProvider();
  }
  return stubProviders[method];
}
