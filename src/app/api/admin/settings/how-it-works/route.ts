import { NextResponse } from "next/server";
import { z } from "zod";
import { getHowItWorksContentForAdmin, saveHowItWorksContent } from "@/infrastructure/content/howItWorksService";

const updateSchema = z.object({
  heading: z.string().trim().min(1, "Заглавието е задължително."),
  steps: z.array(
    z.object({
      title: z.string().trim().min(1, "Заглавието на стъпката е задължително."),
      description: z.string().trim(),
    }),
  ),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getHowItWorksContentForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveHowItWorksContent(parsed.data);
  return NextResponse.json({ data: await getHowItWorksContentForAdmin() });
}
