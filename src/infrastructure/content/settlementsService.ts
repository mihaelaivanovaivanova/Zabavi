import { fetchSpeedySettlements, type SpeedySettlement } from "@/infrastructure/shipping/speedyApiClient";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

/**
 * Bulgaria's full settlement nomenclature for the "Населено място" picker,
 * ported from smisul.bg's `BulgarianSettlementService`: effectively static
 * reference data (not carrier data), so it's cached independently of which
 * carrier ends up delivering the order — a week's TTL, same as there.
 */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredPayload {
  fetchedAt: string;
  settlements: SpeedySettlement[];
}

export async function getSettlements(): Promise<SpeedySettlement[]> {
  const stored = (await settingsRepository.get("speedy_settlements")) as StoredPayload | null;

  if (stored && Date.now() - new Date(stored.fetchedAt).getTime() < CACHE_TTL_MS) {
    return stored.settlements;
  }

  try {
    const settlements = await fetchSpeedySettlements();
    if (settlements.length > 0) {
      await settingsRepository.save("speedy_settlements", {
        fetchedAt: new Date().toISOString(),
        settlements,
      } satisfies StoredPayload);
      return settlements;
    }
  } catch (error) {
    console.error("Failed to refresh the Bulgarian settlement list.", error instanceof Error ? error.message : error);
  }

  // A fetch failure (or Speedy not configured yet) falls back to whatever
  // was cached before, even if stale, rather than leaving the picker empty.
  return stored?.settlements ?? [];
}
