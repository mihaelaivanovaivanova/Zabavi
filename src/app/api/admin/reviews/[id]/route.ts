import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewRepository } from "@/infrastructure/repositories/reviewRepository";

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "hidden"]),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await reviewRepository.findById(id);
  if (!review) {
    return NextResponse.json({ error: "Отзивът не е намерен." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await reviewRepository.save({ ...review, status: parsed.data.status });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await reviewRepository.delete(id);
  return NextResponse.json({ success: true });
}
