import { getProductBySlug } from "@/config/site";
import type { CartLineItem, OrderTotals } from "@/domain/cart/types";
import type { PaymentMethodId } from "@/domain/payment/types";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";
import { getCodFeeEur } from "@/infrastructure/settings/checkoutSettingsService";

export type VariantPriceLookup = (productSlug: string, variantId: string) => Promise<number | null> | number | null;

async function defaultPriceLookup(productSlug: string, variantId: string): Promise<number | null> {
  if (!getProductBySlug(productSlug)) return null;
  const kit = await kitRepository.get(variantId);
  return kit.priceEur;
}

export interface CalculateTotalsOptions {
  /** Folds in `checkoutSettingsService.ts`'s COD surcharge when set to `"cash_on_delivery"`. */
  paymentMethod?: PaymentMethodId;
  priceLookup?: VariantPriceLookup;
}

const UNCONFIRMED_TOTALS: OrderTotals = {
  subtotalEur: null,
  shippingEur: null,
  codFeeEur: null,
  totalEur: null,
  isPriceConfirmed: false,
};

/**
 * Server-side totals calculation. Only ever trusts kit prices from the
 * injected lookup (defaulting to `kitRepository`, keyed per variant) — a
 * price submitted by the client is never read.
 */
export async function calculateTotals(
  items: CartLineItem[],
  options: CalculateTotalsOptions = {},
): Promise<OrderTotals> {
  const priceLookup = options.priceLookup ?? defaultPriceLookup;

  if (items.length === 0) {
    return UNCONFIRMED_TOTALS;
  }

  let subtotalEur = 0;

  for (const item of items) {
    const price = await priceLookup(item.productSlug, item.variantId);
    if (price === null) {
      return UNCONFIRMED_TOTALS;
    }
    subtotalEur += price * item.quantity;
  }

  const shippingEur = 0;
  const codFeeEur = options.paymentMethod === "cash_on_delivery" ? await getCodFeeEur() : 0;

  return {
    subtotalEur,
    shippingEur,
    codFeeEur,
    totalEur: subtotalEur + shippingEur + codFeeEur,
    isPriceConfirmed: true,
  };
}
