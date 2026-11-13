export interface KitImage {
  url: string;
  alt: string;
}

/**
 * Admin-configurable data for one product variant ("kit"): its own price,
 * compare-at price, cover photo and gallery — set through /admin/kits.
 * `variantId` matches `ProductVariant.id` in `src/config/site.ts`.
 */
export interface KitDetails {
  variantId: string;
  /** null means the price has not been finalized yet — never render a fabricated number. */
  priceBgn: number | null;
  compareAtPriceBgn: number | null;
  coverImage: KitImage | null;
  gallery: KitImage[];
  updatedAt: string;
}

export function defaultKitDetails(variantId: string): KitDetails {
  return {
    variantId,
    priceBgn: null,
    compareAtPriceBgn: null,
    coverImage: null,
    gallery: [],
    updatedAt: new Date(0).toISOString(),
  };
}
