import { product } from "@/config/site";
import type { ProductVariant } from "@/domain/product/types";

export interface KitImage {
  url: string;
  alt: string;
  /** Crop focal point as a percentage (0-100) of the image, for `object-position` when it's shown cropped to a square. Defaults to 50/50 (center) when unset. */
  focalX?: number;
  focalY?: number;
}

/**
 * Admin-configurable data for one product variant ("kit"): its own price,
 * compare-at price, cover photo, gallery, name and contents — set through
 * /admin/kits. `variantId` matches `ProductVariant.id` in `src/config/site.ts`.
 *
 * `label`/`intro`/`badge`/`contents`/`bonus` are `null` until an admin saves
 * this kit for the first time, meaning "not customized yet" — callers fall
 * back to the matching `ProductVariant` in `src/config/site.ts` for a seed
 * value. Once saved, these fields are the source of truth (an explicit `[]`
 * for `contents`/`bonus` means the admin cleared the list on purpose, not
 * "unset").
 */
export interface KitDetails {
  variantId: string;
  /** null means the price has not been finalized yet — never render a fabricated number. */
  priceEur: number | null;
  compareAtPriceEur: number | null;
  coverImage: KitImage | null;
  gallery: KitImage[];
  label: string | null;
  intro: string | null;
  badge: string | null;
  contents: string[] | null;
  bonus: string[] | null;
  /**
   * Per-kit photos for the "Четирите илюстрации" landing section, aligned by
   * index with `product.illustrations` (always 4 slots). `null` at an index
   * means that slot still shows its placeholder box.
   */
  illustrationImages: (KitImage | null)[];
  /** Per-kit video shown in the "Какво има в кутията" section instead of its placeholder box. `null` means that kit still shows the placeholder. */
  boxContentsVideoUrl: string | null;
  updatedAt: string;
}

export function defaultKitDetails(variantId: string): KitDetails {
  return {
    variantId,
    priceEur: null,
    compareAtPriceEur: null,
    coverImage: null,
    gallery: [],
    label: null,
    intro: null,
    badge: null,
    contents: null,
    bonus: null,
    illustrationImages: product.illustrations.map(() => null),
    boxContentsVideoUrl: null,
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Overlays an admin-saved `KitDetails` on top of its config-defined
 * `ProductVariant`, so every page that renders a variant's name/intro/badge/
 * contents/bonus sees the admin's edits without each caller re-deriving the
 * same null-fallback logic.
 */
export function resolveVariant(variant: ProductVariant, kit: KitDetails | undefined): ProductVariant {
  if (!kit) return variant;
  return {
    ...variant,
    label: kit.label ?? variant.label,
    intro: kit.intro ?? variant.intro,
    badge: kit.badge ?? variant.badge,
    contents: kit.contents ?? variant.contents,
    bonus: kit.bonus ?? variant.bonus,
  };
}
