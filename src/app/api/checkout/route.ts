import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutSchema } from "@/lib/validation";
import { calculateTotals } from "@/domain/cart/calculateTotals";
import { getPaymentProvider } from "@/infrastructure/payments/getPaymentProvider";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { product } from "@/config/site";
import type { OrderDraft } from "@/domain/order/types";

/**
 * Demo checkout endpoint. Validates on the server, recomputes totals from
 * `siteConfig` only (any price sent by the client is ignored), and returns
 * a clearly labeled demo result. No real payment is ever processed and no
 * data leaves this server.
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

  const order: OrderDraft = {
    id: randomUUID(),
    customer: { fullName: values.fullName, phone: values.phone, email: values.email || undefined },
    shippingAddress: { address: values.address, city: values.city, postalCode: values.postalCode },
    deliveryMethod: values.deliveryMethod,
    giftMessage: values.giftMessage,
    items: [{ productSlug: product.slug, variantId: "standard", quantity: values.quantity }],
    paymentMethod: values.paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await orderRepository.save(order);

  const paymentProvider = getPaymentProvider(values.paymentMethod);
  const paymentResult = await paymentProvider.createPayment(order);

  return NextResponse.json({
    success: true,
    demo: true,
    orderId: order.id,
    totals,
    paymentNotice: paymentResult.demoNotice,
  });
}
