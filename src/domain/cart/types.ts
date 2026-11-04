export interface CartLineItem {
  productSlug: string;
  variantId: string;
  quantity: number;
  giftMessage?: string;
}

export interface OrderTotals {
  subtotalBgn: number | null;
  shippingBgn: number | null;
  totalBgn: number | null;
  /** false whenever any line item has no finalized price (e.g. priceBgn is still TBD). */
  isPriceConfirmed: boolean;
}
