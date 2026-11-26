import { NextResponse } from "next/server";
import { z } from "zod";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { InvalidOrderStatusTransitionError, transitionOrderStatus } from "@/domain/order/orderStatusService";

const updateSchema = z.object({
  status: z.enum([
    "awaiting_payment",
    "paid",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "returned",
    "cancelled",
    "refunded",
    "failed",
  ]),
  note: z.string().trim().max(500).optional(),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const order = await orderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  try {
    await transitionOrderStatus(order, parsed.data.status, parsed.data.note ?? null);
  } catch (error) {
    if (error instanceof InvalidOrderStatusTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ data: order });
}
