import { getProductBySlug } from "@/config/site";
import type { CartLineItem, OrderTotals } from "@/domain/cart/types";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";

export type VariantPriceLookup = (productSlug: string, variantId: string) => Promise<number | null> | number | null;

async function defaultPriceLookup(productSlug: string, variantId: string): Promise<number | null> {
  if (!getProductBySlug(productSlug)) return null;
  const kit = await kitRepository.get(variantId);
  return kit.priceBgn;
}

/**
 * Server-side totals calculation. Only ever trusts kit prices from the
 * injected lookup (defaulting to `kitRepository`, keyed per variant) — a
 * price submitted by the client is never read.
 */
export async function calculateTotals(
  items: CartLineItem[],
  priceLookup: VariantPriceLookup = defaultPriceLookup,
): Promise<OrderTotals> {
  if (items.length === 0) {
    return { subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false };
  }

  let subtotalBgn = 0;

  for (const item of items) {
    const price = await priceLookup(item.productSlug, item.variantId);
    if (price === null) {
      return { subtotalBgn: null, shippingBgn: null, totalBgn: null, isPriceConfirmed: false };
    }
    subtotalBgn += price * item.quantity;
  }

  const shippingBgn = 0;

  return {
    subtotalBgn,
    shippingBgn,
    totalBgn: subtotalBgn + shippingBgn,
    isPriceConfirmed: true,
  };
}
