export interface CartLineItem {
  productSlug: string;
  variantId: string;
  quantity: number;
  giftMessage?: string;
}

export interface OrderTotals {
  subtotalEur: number | null;
  shippingEur: number | null;
  totalEur: number | null;
  /** false whenever any line item has no finalized price (e.g. priceEur is still TBD). */
  isPriceConfirmed: boolean;
}
