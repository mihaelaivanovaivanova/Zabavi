import { NextResponse } from "next/server";
import { z } from "zod";
import { product } from "@/config/site";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";

const kitImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string(),
  focalX: z.number().min(0).max(100).optional(),
  focalY: z.number().min(0).max(100).optional(),
});

const illustrationContentSchema = z.object({
  title: z.string().trim().min(1, "Заглавието на илюстрацията е задължително."),
  description: z.string(),
});

const kitUpdateSchema = z.object({
  priceEur: z.number().positive().nullable(),
  compareAtPriceEur: z.number().positive().nullable(),
  coverImage: kitImageSchema.nullable(),
  gallery: z.array(kitImageSchema),
  label: z.string().trim().min(1, "Името на комплекта не може да е празно."),
  intro: z.string().trim(),
  badge: z.string().trim(),
  contents: z.array(z.string().trim().min(1)),
  bonus: z.array(z.string().trim().min(1)),
  illustrationImages: z.array(kitImageSchema.nullable()).length(product.illustrations.length),
  illustrationContent: z.array(illustrationContentSchema).length(product.illustrations.length),
  boxContentsVideoUrl: z.string().min(1).nullable(),
  boxContentsVideoThumbnail: kitImageSchema.nullable(),
  boxContents: z.array(z.string().trim().min(1)),
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
    parsed.data.priceEur !== null &&
    parsed.data.compareAtPriceEur !== null &&
    parsed.data.compareAtPriceEur <= parsed.data.priceEur
  ) {
    return NextResponse.json(
      { error: "Стандартната цена трябва да е по-висока от текущата, иначе няма отстъпка." },
      { status: 400 },
    );
  }

  await kitRepository.save({
    variantId,
    priceEur: parsed.data.priceEur,
    compareAtPriceEur: parsed.data.compareAtPriceEur,
    coverImage: parsed.data.coverImage,
    gallery: parsed.data.gallery,
    label: parsed.data.label,
    intro: parsed.data.intro,
    badge: parsed.data.badge,
    contents: parsed.data.contents,
    bonus: parsed.data.bonus,
    illustrationImages: parsed.data.illustrationImages,
    illustrationContent: parsed.data.illustrationContent,
    boxContentsVideoUrl: parsed.data.boxContentsVideoUrl,
    boxContentsVideoThumbnail: parsed.data.boxContentsVideoThumbnail,
    boxContents: parsed.data.boxContents,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
