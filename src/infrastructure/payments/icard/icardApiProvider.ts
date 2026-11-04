import { calculateTotals } from "@/domain/cart/calculateTotals";
import type { OrderDraft } from "@/domain/order/types";
import {
  PaymentProviderError,
  type PaymentAttemptResult,
  type PaymentNotificationResult,
  type PaymentProvider,
} from "@/domain/payment/types";
import { requestPaymentWidgetToken } from "@/infrastructure/payments/icard/icardApiClient";
import { siteConfig } from "@/config/site";

/**
 * Real iCard IPG integration. `getPaymentProvider` only returns this once
 * RSA keys/MID/Originator are configured — see `icardApiClient.ts`.
 * Renders as an embedded widget client-side (never a redirect) — see
 * `ICardPaymentWidget.tsx`.
 */
export class ICardApiProvider implements PaymentProvider {
  readonly method = "card_icard" as const;

  async createPayment(order: OrderDraft): Promise<PaymentAttemptResult> {
    const totals = calculateTotals(order.items);
    if (!totals.isPriceConfirmed || totals.totalBgn === null) {
      throw new PaymentProviderError(
        "Истинско плащане не може да бъде заявено без зададена истинска цена на продукта (priceBgn е TBD).",
      );
    }
    if (!order.customerIp) {
      throw new PaymentProviderError("Истинско плащане с карта изисква IP адрес на клиента, който не е заловен.");
    }
    if (!order.billingAddress) {
      throw new PaymentProviderError("Истинско плащане с карта изисква адрес за фактуриране.");
    }
    if (!order.customer.email) {
      throw new PaymentProviderError("Истинско плащане с карта изисква имейл на клиента.");
    }

    const { token } = await requestPaymentWidgetToken({
      orderId: order.id,
      amountBgn: totals.totalBgn,
      customerIp: order.customerIp,
      customerName: order.customer.fullName,
      customerEmail: order.customer.email,
      billingCity: order.billingAddress.city,
      billingPostCode: order.billingAddress.postalCode,
      billingAddressLine1: order.billingAddress.address,
      urlNotify: new URL("/api/webhooks/icard", siteConfig.brand.url).toString(),
    });

    return {
      status: "pending",
      isLive: true,
      notice: "Завърши плащането във вградения формуляр на iCard по-долу.",
      widgetToken: token,
    };
  }

  async verifyNotification(): Promise<PaymentNotificationResult> {
    // Real verification happens in /api/webhooks/icard, which has access to
    // the raw, order-preserving POST body the signature was computed over —
    // something this generic interface (arbitrary `payload: unknown`) can't
    // guarantee. See `icardSignature.ts` + the webhook route handler.
    return { verified: false, alreadyProcessed: false };
  }
}
