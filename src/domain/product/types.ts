export interface PlaceholderImage {
  /** Short label shown inside the placeholder block until a real asset is supplied. */
  label: string;
  alt: string;
  /** Real image URL, e.g. uploaded through /admin/kits. Renders instead of the placeholder box when set. */
  url?: string;
}

export interface ProductVariant {
  id: string;
  label: string;
}

export interface Illustration {
  title: string;
  description: string;
  image: PlaceholderImage;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Product photo gallery, shown as a carousel. At least one entry. */
  gallery: PlaceholderImage[];
  boxContents: string[];
  /** Short trust/USP badges shown under the hero tagline. */
  highlights: string[];
  illustrations: Illustration[];
  variants: ProductVariant[];
  /** Price/photos are per-kit now — see `src/domain/kit/types.ts` and /admin/kits, not a single product-wide value. */
  currency: "BGN";
  /** Rating out of 5 shown under the product name. */
  rating: number;
}

export interface Testimonial {
  author: string;
  quote: string;
}
