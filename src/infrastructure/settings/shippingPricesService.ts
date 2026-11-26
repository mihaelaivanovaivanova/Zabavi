import type { DeliveryMethodId } from "@/domain/shipping/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

/**
 * Admin-configurable flat price per delivery method — mirrors smisul.bg's
 * own `ShippingProviderSettingsService::priceFor()` fallback shape (a flat
 * admin-set rate), not its network-calling `quote()`. Defaults to `0` for
 * every method, so nothing changes until the admin sets a real price —
 * same "free shipping" behavior ЗАБАВЍ has always had.
 */
export type ShippingPrices = Record<DeliveryMethodId, number>;

const DEFAULT_PRICES: ShippingPrices = {
  box_now: 0,
  courier: 0,
  speedy_office: 0,
  speedy_locker: 0,
};

async function loadStored(): Promise<Partial<ShippingPrices> | null> {
  return (await settingsRepository.get("shipping_prices")) as Partial<ShippingPrices> | null;
}

export async function getShippingPrices(): Promise<ShippingPrices> {
  const stored = await loadStored();
  return { ...DEFAULT_PRICES, ...stored };
}

export async function getShippingPriceFor(method: DeliveryMethodId): Promise<number> {
  const prices = await getShippingPrices();
  return prices[method];
}

export async function saveShippingPrices(prices: ShippingPrices): Promise<void> {
  await settingsRepository.save("shipping_prices", prices as unknown as Record<string, unknown>);
}
