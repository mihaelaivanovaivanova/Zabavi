import { getICardPublicKey } from "@/infrastructure/payments/icard/icardApiClient";
import { parseFormUrlEncodedOrdered, verifyIcardFields } from "@/infrastructure/payments/icard/icardSignature";
import { notificationIdempotencyStore } from "@/infrastructure/payments/notificationIdempotency";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { transitionOrderStatus } from "@/domain/order/orderStatusService";

/**
 * iCard calls this URL (set as `URL_Notify` on the payment token request)
 * asynchronously after a payment attempt. Per the IPG manual, the response
 * body must be exactly the string "OK" on success — anything else makes
 * iCard treat the notification as failed and schedule a reversal. We only
 * ever update order/payment state after the RSA signature verifies.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let pairs: [string, string][];
  try {
    pairs = parseFormUrlEncodedOrdered(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const fields = Object.fromEntries(pairs);
  const signature = fields.Signature;
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const publicKey = await getICardPublicKey();
  if (!publicKey) {
    return new Response("Not configured", { status: 503 });
  }

  const signedPairs = pairs.filter(([key]) => key !== "Signature");
  if (!verifyIcardFields(signedPairs, signature, publicKey)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const orderId = fields.OrderID;

  if (fields.IPGmethod === "IPGPurchaseNotify") {
    const idempotencyKey = `IPGPurchaseNotify:${fields.IPG_Trnref || orderId}`;
    if (await notificationIdempotencyStore.hasProcessed(idempotencyKey)) {
      return new Response("OK", { status: 200 });
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      return new Response("Unknown order", { status: 404 });
    }

    order.paymentStatus = "paid";
    await transitionOrderStatus(order, "paid", "Плащането с карта е потвърдено.");
    await notificationIdempotencyStore.markProcessed(idempotencyKey);
    return new Response("OK", { status: 200 });
  }

  if (fields.IPGmethod === "IPGPurchaseRollback") {
    const idempotencyKey = `IPGPurchaseRollback:${orderId}`;
    if (await notificationIdempotencyStore.hasProcessed(idempotencyKey)) {
      return new Response("OK", { status: 200 });
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      return new Response("Unknown order", { status: 404 });
    }

    order.paymentStatus = "failed";
    await transitionOrderStatus(order, "failed", "Плащането с карта е отхвърлено.");
    await notificationIdempotencyStore.markProcessed(idempotencyKey);
    return new Response("OK", { status: 200 });
  }

  return new Response(`Unhandled IPGmethod: ${fields.IPGmethod ?? "(none)"}`, { status: 400 });
}
