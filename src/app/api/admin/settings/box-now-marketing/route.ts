import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBoxNowMarketingContentForAdmin,
  saveBoxNowMarketingContent,
} from "@/infrastructure/content/boxNowMarketingService";

const updateSchema = z.object({
  bannerEnabled: z.boolean(),
  badgeEnabled: z.boolean(),
  bannerMessage: z.string().trim().min(1, "Текстът на лентата е задължителен."),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getBoxNowMarketingContentForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveBoxNowMarketingContent(parsed.data);
  return NextResponse.json({ data: await getBoxNowMarketingContentForAdmin() });
}
