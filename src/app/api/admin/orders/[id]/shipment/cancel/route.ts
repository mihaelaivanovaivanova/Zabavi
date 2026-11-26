import { NextResponse } from "next/server";
import { z } from "zod";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { ShippingProviderError } from "@/domain/shipping/types";
import { cancelOrderShipment } from "@/infrastructure/shipping/carrierActions";

const bodySchema = z.object({ reason: z.string().trim().max(200).optional() });

/**
 * Gated by proxy.ts — only reachable with a valid admin session cookie.
 * Independent of the order's own `status` — mirrors smisul.bg: cancelling a
 * shipment doesn't by itself cancel the order (e.g. a wrong address can be
 * fixed and the shipment re-created without discarding the whole order).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  }

  const order = await orderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  try {
    await cancelOrderShipment(order, parsed.data.reason ?? null);
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }

  order.shipmentStatus = "cancelled";
  order.shipmentEvents = [
    ...(order.shipmentEvents ?? []),
    { event: "Анулирана от администратор", parcelId: order.trackingNumber, occurredAt: new Date().toISOString() },
  ];
  await orderRepository.save(order);

  return NextResponse.json({ data: order });
}
