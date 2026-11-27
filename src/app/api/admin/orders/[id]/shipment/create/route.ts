import { NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { ShippingProviderError } from "@/domain/shipping/types";
import { createOrderShipment } from "@/infrastructure/shipping/carrierActions";

/**
 * Gated by proxy.ts — only reachable with a valid admin session cookie.
 * The recovery path for orders left without a tracking number — automatic
 * shipment creation (see `orderStatusService.ts`'s `createShipmentIfNeeded`)
 * deliberately swallows every failure so a carrier outage never undoes an
 * already-confirmed order, which means nothing else ever surfaces *why* it
 * failed (missing/wrong carrier credentials, a rejected address, etc.) or
 * retries it. This does both: it reuses the exact same shipment-creation
 * call but lets a real failure come back as a visible error instead.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await orderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  if (order.trackingNumber) {
    return NextResponse.json({ error: "Поръчката вече има заявена пратка." }, { status: 400 });
  }

  try {
    const result = await createOrderShipment(order);
    if (result.isLive && result.referenceNumber) {
      order.trackingNumber = result.referenceNumber;
      order.shipmentStatus = "accepted";
      order.shipmentEvents = [
        ...(order.shipmentEvents ?? []),
        { event: "Заявена пратка (ръчно от администратор)", parcelId: result.referenceNumber, occurredAt: new Date().toISOString() },
      ];
      await orderRepository.save(order);
    }
    return NextResponse.json({ data: order, notice: result.notice });
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
