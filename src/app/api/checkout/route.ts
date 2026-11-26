import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/http";
import { generateOrderNumber } from "@/lib/orderNumber";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import { transitionOrderStatus } from "@/domain/order/orderStatusService";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { product } from "@/config/site";
import type { OrderDraft } from "@/domain/order/types";
import { PaymentProviderError } from "@/domain/payment/types";
import { InvalidOrderStatusTransitionError } from "@/domain/order/orderStatusService";
import type { ShippingDetails } from "@/domain/shipping/types";

const CARD_AWAITING_PAYMENT_NOTICE =
  "Плащането предстои — пратката ще бъде заявена автоматично веднага щом плащането с карта бъде потвърдено.";

/**
 * Demo checkout endpoint. Validates on the server, recomputes totals from
 * `siteConfig` only (any price sent by the client is ignored), and returns
 * a clearly labeled demo result unless a real payment/shipping provider is
 * configured. No real payment or shipment is ever created silently — a
 * real provider failure is surfaced as an error, never masked as success.
 *
 * The real shipment and the confirmation/admin-notification emails are
 * deliberately NOT created here for a card order — only once the iCard
 * webhook actually confirms payment (see `webhooks/icard/route.ts`), via
 * `transitionOrderStatus`. A cash-on-delivery order has nothing to wait
 * for, so it's confirmed (and its shipment/emails triggered) immediately.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const values = parsed.data;

  const totals = await calculateTotals(
    [{ productSlug: product.slug, variantId: values.variantId, quantity: values.quantity }],
    { paymentMethod: values.paymentMethod },
  );

  const shippingDetails: ShippingDetails =
    values.deliveryMethod === "box_now"
      ? {
          method: "box_now",
          lockerId: values.boxNowLockerId ?? "",
          addressLine1: values.boxNowLockerAddressLine1 ?? "",
          postalCode: values.boxNowLockerPostalCode ?? "",
        }
      : {
          method: "courier",
          address: values.address ?? "",
          city: values.city ?? "",
          postalCode: values.postalCode ?? "",
        };

  const createdAt = new Date();
  const order: OrderDraft = {
    id: randomUUID(),
    orderNumber: generateOrderNumber(createdAt),
    customer: { fullName: values.fullName, phone: values.phone, email: values.email || undefined },
    customerIp: getClientIp(request),
    billingAddress:
      values.address && values.city && values.postalCode
        ? { address: values.address, city: values.city, postalCode: values.postalCode }
        : undefined,
    shippingDetails,
    giftMessage: values.giftMessage,
    items: [{ productSlug: product.slug, variantId: values.variantId, quantity: values.quantity }],
    paymentMethod: values.paymentMethod,
    status: "awaiting_payment",
    totalEur: totals.totalEur,
    totalsSnapshot: { subtotalEur: totals.subtotalEur, shippingEur: totals.shippingEur, codFeeEur: totals.codFeeEur },
    statusHistory: [{ status: "awaiting_payment", previousStatus: null, note: null, occurredAt: createdAt.toISOString() }],
    createdAt: createdAt.toISOString(),
  };

  const paymentProvider = await getPaymentProvider(values.paymentMethod);
  let paymentResult;
  try {
    paymentResult = await paymentProvider.createPayment(order);
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }
    throw error;
  }
  order.paymentStatus = paymentResult.status;

  let shippingNotice = CARD_AWAITING_PAYMENT_NOTICE;
  let shippingIsLive = false;

  if (values.paymentMethod === "cash_on_delivery") {
    try {
      const { shipmentResult } = await transitionOrderStatus(order, "confirmed", "Избран е наложен платеж.");
      shippingNotice = shipmentResult?.notice ?? "Поръчката е потвърдена; пратката предстои да бъде заявена.";
      shippingIsLive = shipmentResult?.isLive ?? false;
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      throw error;
    }
  } else {
    await orderRepository.save(order);
  }

  return NextResponse.json({
    success: true,
    demo: true,
    shippingIsLive,
    paymentIsLive: paymentResult.isLive,
    orderId: order.id,
    totals,
    paymentNotice: paymentResult.notice,
    paymentWidgetToken: paymentResult.widgetToken,
    shippingNotice,
  });
}
