import { NextResponse } from "next/server";
import { z } from "zod";
import { submitReview } from "@/infrastructure/reviews/reviewService";

const submitSchema = z.object({
  rating: z.number().min(1).max(5),
  body: z.string().trim().min(1, "Отзивът не може да е празен."),
  email: z.string().trim().email("Невалиден имейл адрес."),
  displayName: z.string().trim().min(1, "Името е задължително."),
  isAnonymous: z.boolean(),
});

/**
 * Public. Always returns the same success shape regardless of whether a
 * confirmation email was actually sent — see `submitReview` for why.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await submitReview(parsed.data);
  return NextResponse.json({ success: true });
}
