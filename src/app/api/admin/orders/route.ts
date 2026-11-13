import { NextResponse, connection } from "next/server";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  // In-memory repo read has no request-time signal of its own — opt out of
  // the static shell so this never serves a frozen build-time snapshot.
  await connection();
  const orders = await orderRepository.findAll();
  return NextResponse.json({ orders });
}
