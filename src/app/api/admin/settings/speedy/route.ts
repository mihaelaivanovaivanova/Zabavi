import { NextResponse } from "next/server";
import { z } from "zod";
import { getSpeedySettingsForAdmin, saveSpeedySettings } from "@/infrastructure/settings/speedySettingsService";

const updateSchema = z.object({
  enabled: z.boolean(),
  apiUrl: z.string().trim(),
  username: z.string().trim(),
  dropoffOfficeId: z.string().trim(),
  serviceId: z.string().trim(),
  password: z.string().optional(),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getSpeedySettingsForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveSpeedySettings(parsed.data);
  return NextResponse.json({ data: await getSpeedySettingsForAdmin() });
}
