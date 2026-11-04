import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutSchema } from "@/lib/validation";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import { getShippingProvider } from "@/infrastructure/shipping/getShippingProvider";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { product } from "@/config/site";
import type { OrderDraft } from "@/domain/order/types";
import type { ShippingDetails } from "@/domain/shipping/types";

/**
 * Demo checkout endpoint. Validates on the server, recomputes totals from
 * `siteConfig` only (any price sent by the client is ignored), and returns
 * a clearly labeled demo result. No real payment or shipment is ever
 * created and no data leaves this server.
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

  const totals = calculateTotals([
    { productSlug: product.slug, variantId: "standard", quantity: values.quantity },
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

  const order: OrderDraft = {
    id: randomUUID(),
    customer: { fullName: values.fullName, phone: values.phone, email: values.email || undefined },
    shippingDetails,
    giftMessage: values.giftMessage,
    items: [{ productSlug: product.slug, variantId: "standard", quantity: values.quantity }],
    paymentMethod: values.paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await orderRepository.save(order);

  const paymentProvider = getPaymentProvider(values.paymentMethod);
  const paymentResult = await paymentProvider.createPayment(order);

  const shippingProvider = getShippingProvider(values.deliveryMethod);
  const shippingResult = await shippingProvider.createShipment(order);

  return NextResponse.json({
    success: true,
    demo: true,
    orderId: order.id,
    totals,
    paymentNotice: paymentResult.demoNotice,
    shippingNotice: shippingResult.demoNotice,
  });
}
