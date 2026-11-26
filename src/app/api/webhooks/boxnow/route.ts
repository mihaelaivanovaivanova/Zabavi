import { NextResponse } from "next/server";
import { notificationIdempotencyStore } from "@/infrastructure/payments/notificationIdempotency";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { InvalidOrderStatusTransitionError, transitionOrderStatus } from "@/domain/order/orderStatusService";
import type { ShipmentTrackingEvent } from "@/domain/order/types";

/**
 * BOX NOW's parcel-tracking webhook, per their "Webhook Based Parcel
 * Tracking Guide" (CloudEvents envelope, `type: "bg.boxnow.parcel_event_change"`).
 * We set `data.orderNumber` to our own `order.id` when creating the shipment
 * (see `boxNowApiClient.ts`), so events map straight back to an order —
 * no separate parcel-id lookup table needed.
 *
 * Authentication: the guide doesn't mandate a signature scheme — "if
 * additional authentication is required, this can be managed through
 * request headers," configured together with BOX NOW when the webhook URL
 * is registered. Confirm the real header name with BOX NOW support and
 * adjust `AUTH_HEADER` below if it differs; until then this checks a
 * bearer-style shared secret.
 */
const AUTH_HEADER = "authorization";

interface BoxNowWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    orderNumber?: string;
    parcelId?: string;
    event?: string;
    time?: string;
  };
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.BOXNOW_WEBHOOK_SECRET;
  if (!secret) return false;
  return request.headers.get(AUTH_HEADER) === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!process.env.BOXNOW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: BoxNowWebhookPayload | null = await request.json().catch(() => null);
  const data = payload?.data;
  if (!payload || !data?.orderNumber || !data.event) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const idempotencyKey = `boxnow:${data.parcelId ?? data.orderNumber}:${data.event}:${data.time ?? payload.id ?? ""}`;
  if (await notificationIdempotencyStore.hasProcessed(idempotencyKey)) {
    return NextResponse.json({ received: true });
  }

  const order = await orderRepository.findById(data.orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  const trackingEvent: ShipmentTrackingEvent = {
    event: data.event,
    parcelId: data.parcelId,
    occurredAt: data.time ?? new Date().toISOString(),
  };
  order.shipmentEvents = [...(order.shipmentEvents ?? []), trackingEvent];
  await orderRepository.save(order);

  if (data.event === "Cancelled" || data.event === "Cancelled-return") {
    // Only ever through the shared status service — never a direct write —
    // so this still validates the move and fires the cancelled email. Not
    // every order is in a cancellable state when this fires (e.g. already
    // delivered); that's logged and otherwise ignored rather than failing
    // the webhook, since BOX NOW doesn't care whether our own status model
    // accepted the move.
    try {
      await transitionOrderStatus(order, "cancelled", `BOX NOW: ${data.event}`);
    } catch (error) {
      if (!(error instanceof InvalidOrderStatusTransitionError)) throw error;
      console.warn("BOX NOW webhook reported a cancellation that doesn't fit the order's current status.", {
        orderId: order.id,
        status: order.status,
      });
    }
  }

  await notificationIdempotencyStore.markProcessed(idempotencyKey);

  return NextResponse.json({ received: true });
}
