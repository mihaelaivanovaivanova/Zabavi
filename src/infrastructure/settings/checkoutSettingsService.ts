import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

/**
 * Checkout-wide pricing knobs that aren't tied to any single carrier —
 * currently just the cash-on-delivery surcharge, admin-editable via
 * `/admin/settings/shipping` (mirrors smisul.bg's own `cod_fee`, which it
 * keeps on its shipping-provider settings for the same reason: it only
 * ever applies to the one carrier/payment combo that offers COD).
 */
const DEFAULT_COD_FEE_EUR = 0.5;

interface StoredPayload {
  codFeeEur?: number;
}

async function loadStored(): Promise<StoredPayload | null> {
  return (await settingsRepository.get("checkout")) as StoredPayload | null;
}

export async function getCodFeeEur(): Promise<number> {
  const stored = await loadStored();
  if (typeof stored?.codFeeEur === "number") return stored.codFeeEur;

  const envValue = Number(process.env.COD_FEE_EUR);
  return Number.isFinite(envValue) && process.env.COD_FEE_EUR ? envValue : DEFAULT_COD_FEE_EUR;
}

export async function saveCodFeeEur(codFeeEur: number): Promise<void> {
  await settingsRepository.save("checkout", { codFeeEur } satisfies StoredPayload);
}
