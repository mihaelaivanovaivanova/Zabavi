import { NextResponse } from "next/server";
import { z } from "zod";
import { getShippingPrices, saveShippingPrices } from "@/infrastructure/settings/shippingPricesService";

const updateSchema = z.object({
  box_now: z.number().min(0),
  courier: z.number().min(0),
  speedy_office: z.number().min(0),
  speedy_locker: z.number().min(0),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getShippingPrices() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveShippingPrices(parsed.data);
  return NextResponse.json({ data: await getShippingPrices() });
}
