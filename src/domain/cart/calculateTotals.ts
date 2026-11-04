import { getProductBySlug } from "@/config/site";
import type { CartLineItem, OrderTotals } from "@/domain/cart/types";
import type { Product } from "@/domain/product/types";

/**
 * Server-side totals calculation. Only ever trusts product prices from the
 * injected lookup (defaulting to `siteConfig`/`product`) — a price
 * submitted by the client is never read.
 */
export function calculateTotals(
  items: CartLineItem[],
  productLookup: (slug: string) => Product | undefined = getProductBySlug,
): OrderTotals {
  if (items.length === 0) {
    return { subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false };
  }

  let subtotalBgn = 0;

  for (const item of items) {
    const matchedProduct = productLookup(item.productSlug);
    if (!matchedProduct || matchedProduct.priceBgn === null) {
      return { subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false };
    }
    subtotalBgn += matchedProduct.priceBgn * item.quantity;
  }

  const shippingBgn = 0;

  return {
    subtotalBgn,
    shippingBgn,
    totalBgn: subtotalBgn + shippingBgn,
    isPriceConfirmed: true,
  };
}
