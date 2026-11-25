import { NextResponse } from "next/server";
import { z } from "zod";
import { getFaqContentForAdmin, saveFaqContent } from "@/infrastructure/content/faqService";

const updateSchema = z.object({
  items: z.array(
    z.object({
      question: z.string().trim().min(1, "Въпросът не може да е празен."),
      answer: z.string().trim().min(1, "Отговорът не може да е празен."),
    }),
  ),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  return NextResponse.json({ data: await getFaqContentForAdmin() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await saveFaqContent(parsed.data);
  return NextResponse.json({ data: await getFaqContentForAdmin() });
}
