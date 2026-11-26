import { NextResponse } from "next/server";
import { z } from "zod";
import { getCodFeeEur, saveCodFeeEur } from "@/infrastructure/settings/checkoutSettingsService";

const updateSchema = z.object({
  codFeeEur: z.number().min(0),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: { codFeeEur: await getCodFeeEur() } });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveCodFeeEur(parsed.data.codFeeEur);
  return NextResponse.json({ data: { codFeeEur: await getCodFeeEur() } });
}
