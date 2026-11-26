export interface PlaceholderImage {
  /** Short label shown inside the placeholder block until a real asset is supplied. */
  label: string;
  alt: string;
  /** Real image URL, e.g. uploaded through /admin/kits. Renders instead of the placeholder box when set. */
  url?: string;
  /** Crop focal point as a percentage (0-100), for `object-position` when shown cropped to a square. Defaults to center. */
  focalX?: number;
  focalY?: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  /** Short mood-setting line shown above the "Получаваш:" list on this variant's price card. */
  intro?: string;
  /** What's inside this specific variant's kit, shown as a "Получаваш:" list on its price card. */
  contents?: string[];
  /** Extra bonus items for this variant, shown as a "Бонус:" list on its price card. */
  bonus?: string[];
  /** Short label shown as a corner tag on this variant's tab, e.g. "Лимитирано". */
  badge?: string;
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
  /** Default heading/intro for the "Четирите илюстрации" section — overridden by `/admin/settings`, see `@/domain/content/types`. */
  illustrationsSection: { heading: string; intro: string };
  /** Default heading/steps for the "Как протича рисуването" section — overridden by `/admin/settings`, see `@/domain/content/types`. */
  howItWorksSection: { heading: string; steps: { title: string; description: string }[] };
  variants: ProductVariant[];
  /** Price/photos are per-kit now — see `src/domain/kit/types.ts` and /admin/kits, not a single product-wide value. */
  currency: "EUR";
  /** Rating out of 5 shown under the product name. */
  rating: number;
}

export interface Testimonial {
  author: string;
  quote: string;
}
