import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getIllustrationsSectionContentForAdmin,
  saveIllustrationsSectionContent,
} from "@/infrastructure/content/illustrationsSectionService";

const updateSchema = z.object({
  heading: z.string().trim().min(1, "Заглавието е задължително."),
  intro: z.string(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Заглавието на илюстрацията е задължително."),
        description: z.string(),
      }),
    )
    .length(4),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getIllustrationsSectionContentForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveIllustrationsSectionContent(parsed.data);
  return NextResponse.json({ data: await getIllustrationsSectionContentForAdmin() });
}
