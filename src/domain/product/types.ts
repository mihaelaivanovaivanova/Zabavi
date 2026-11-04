export interface PlaceholderImage {
  /** Short label shown inside the placeholder block until a real asset is supplied. */
  label: string;
  alt: string;
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
  heroImage: PlaceholderImage;
  boxContents: string[];
  illustrations: Illustration[];
  variants: ProductVariant[];
  /** null means the price has not been finalized yet — never render a fabricated number. */
  priceBgn: number | null;
  currency: "BGN";
}
