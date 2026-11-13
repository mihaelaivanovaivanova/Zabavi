import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/http";
import { generateOrderNumber } from "@/lib/orderNumber";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import { getShippingProvider } from "@/infrastructure/shipping/getShippingProvider";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { product } from "@/config/site";
import type { OrderDraft } from "@/domain/order/types";
import { PaymentProviderError } from "@/domain/payment/types";
import { ShippingProviderError, type ShippingDetails } from "@/domain/shipping/types";

/**
 * Demo checkout endpoint. Validates on the server, recomputes totals from
 * `siteConfig` only (any price sent by the client is ignored), and returns
 * a clearly labeled demo result unless a real payment/shipping provider is
 * configured. No real payment or shipment is ever created silently — a
 * real provider failure is surfaced as an error, never masked as success.
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

  const totals = await calculateTotals([
    { productSlug: product.slug, variantId: values.variantId, quantity: values.quantity },
  ]);

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
    status: "pending",
    createdAt: createdAt.toISOString(),
  };

  const paymentProvider = getPaymentProvider(values.paymentMethod);
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

  const shippingProvider = getShippingProvider(values.deliveryMethod);
  let shippingResult;
  try {
    shippingResult = await shippingProvider.createShipment(order);
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }
    throw error;
  }

  await orderRepository.save(order);

  return NextResponse.json({
    success: true,
    demo: true,
    shippingIsLive: shippingResult.isLive,
    paymentIsLive: paymentResult.isLive,
    orderId: order.id,
    totals,
    paymentNotice: paymentResult.notice,
    paymentWidgetToken: paymentResult.widgetToken,
    shippingNotice: shippingResult.notice,
  });
}
