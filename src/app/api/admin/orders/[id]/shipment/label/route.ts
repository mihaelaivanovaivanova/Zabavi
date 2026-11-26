import { NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { ShippingProviderError } from "@/domain/shipping/types";
import { fetchOrderShipmentLabel } from "@/infrastructure/shipping/carrierActions";

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await orderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  try {
    const pdf = await fetchOrderShipmentLabel(order);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="label-${order.orderNumber ?? order.id}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
