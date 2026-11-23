import { NextResponse } from "next/server";
import { z } from "zod";
import { getBoxNowSettingsForAdmin, saveBoxNowSettings } from "@/infrastructure/settings/boxNowSettingsService";

const updateSchema = z.object({
  enabled: z.boolean(),
  apiUrl: z.string().trim(),
  clientId: z.string().trim(),
  originLocationId: z.string().trim(),
  originContactName: z.string().trim(),
  originContactEmail: z.string().trim(),
  originContactNumber: z.string().trim(),
  partnerId: z.string().trim(),
  clientSecret: z.string().optional(),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getBoxNowSettingsForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveBoxNowSettings(parsed.data);
  return NextResponse.json({ data: await getBoxNowSettingsForAdmin() });
}
