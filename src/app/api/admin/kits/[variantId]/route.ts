import { NextResponse } from "next/server";
import { z } from "zod";
import { product } from "@/config/site";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";

const kitImageSchema = z.object({ url: z.string().min(1), alt: z.string() });

const kitUpdateSchema = z.object({
  priceBgn: z.number().positive().nullable(),
  compareAtPriceBgn: z.number().positive().nullable(),
  coverImage: kitImageSchema.nullable(),
  gallery: z.array(kitImageSchema),
});

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function PUT(request: Request, { params }: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await params;

  if (!product.variants.some((variant) => variant.id === variantId)) {
    return NextResponse.json({ error: "Непознат комплект." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = kitUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (
    parsed.data.priceBgn !== null &&
    parsed.data.compareAtPriceBgn !== null &&
    parsed.data.compareAtPriceBgn <= parsed.data.priceBgn
  ) {
    return NextResponse.json(
      { error: "Стандартната цена трябва да е по-висока от текущата, иначе няма отстъпка." },
      { status: 400 },
    );
  }

  await kitRepository.save({
    variantId,
    priceBgn: parsed.data.priceBgn,
    compareAtPriceBgn: parsed.data.compareAtPriceBgn,
    coverImage: parsed.data.coverImage,
    gallery: parsed.data.gallery,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
