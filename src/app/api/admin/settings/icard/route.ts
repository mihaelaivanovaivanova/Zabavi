import { NextResponse } from "next/server";
import { z } from "zod";
import { getICardSettingsForAdmin, saveICardSettings } from "@/infrastructure/settings/icardSettingsService";

const updateSchema = z.object({
  enabled: z.boolean(),
  apiUrl: z.string().url(),
  originator: z.string().trim(),
  mid: z.string().trim(),
  midName: z.string().trim().min(1, "Името на търговеца е задължително."),
  keyIndex: z.string().trim(),
  ipgVersion: z.string().trim(),
  language: z.string().trim(),
  privateKey: z.string().optional(),
  icardPublicKey: z.string().optional(),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getICardSettingsForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveICardSettings(parsed.data);
  return NextResponse.json({ data: await getICardSettingsForAdmin() });
}
