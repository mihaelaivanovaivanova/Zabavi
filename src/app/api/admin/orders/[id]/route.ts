import { NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { ShippingProviderError, isFinalShipmentStatus } from "@/domain/shipping/types";
import { cancelOrderShipment } from "@/infrastructure/shipping/carrierActions";

/**
 * Gated by proxy.ts — only reachable with a valid admin session cookie.
 * Permanently deletes the order. If a shipment was created and isn't
 * already in a final state, it's cancelled with the carrier first — and
 * this **fails closed**: if that cancel errors, the delete is aborted
 * rather than risk silently orphaning a real parcel still in transit with
 * no record of it left behind.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await orderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  if (order.trackingNumber && order.shipmentStatus && !isFinalShipmentStatus(order.shipmentStatus)) {
    try {
      await cancelOrderShipment(order, "Поръчката беше изтрита.");
    } catch (error) {
      const message = error instanceof ShippingProviderError ? error.message : "Неуспешно анулиране на пратката.";
      return NextResponse.json(
        { error: `Пратката не можа да бъде анулирана, затова поръчката не беше изтрита: ${message}` },
        { status: 502 },
      );
    }
  }

  await orderRepository.delete(id);
  return NextResponse.json({ data: { deleted: true } });
}
