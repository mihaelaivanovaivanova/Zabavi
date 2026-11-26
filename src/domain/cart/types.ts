export interface CartLineItem {
  productSlug: string;
  variantId: string;
  quantity: number;
  giftMessage?: string;
}

export interface OrderTotals {
  subtotalEur: number | null;
  shippingEur: number | null;
  /** Flat surcharge applied only for cash-on-delivery orders — see `checkoutSettingsService.ts`. `0`/`null` otherwise, matching the other fields' null-while-unconfirmed shape. */
  codFeeEur: number | null;
  totalEur: number | null;
  /** false whenever any line item has no finalized price (e.g. priceEur is still TBD). */
  isPriceConfirmed: boolean;
}
