import { searchSpeedyOffices, type SpeedyOffice } from "@/infrastructure/shipping/speedyApiClient";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

/**
 * Every Speedy office and automated machine (APT) in Bulgaria, in one flat
 * list — lets the checkout's "Град" picker for Speedy pickup points list
 * only cities that actually have an office/locker, same as smisul.bg's own
 * `OfficePicker` (which derives its city list from one already-fetched,
 * unfiltered-by-city office list, not from the general settlement
 * nomenclature). The unfiltered call is slow (~30s) — cached a week, same
 * TTL and fallback-to-stale-on-failure shape as settlementsService.ts.
 */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredPayload {
  fetchedAt: string;
  offices: SpeedyOffice[];
}

export async function getAllSpeedyOffices(): Promise<SpeedyOffice[]> {
  const stored = (await settingsRepository.get("speedy_offices")) as StoredPayload | null;

  if (stored && Date.now() - new Date(stored.fetchedAt).getTime() < CACHE_TTL_MS) {
    return stored.offices;
  }

  try {
    const offices = await searchSpeedyOffices();
    if (offices.length > 0) {
      await settingsRepository.save("speedy_offices", {
        fetchedAt: new Date().toISOString(),
        offices,
      } satisfies StoredPayload);
      return offices;
    }
  } catch (error) {
    console.error("Failed to refresh the Speedy offices list.", error instanceof Error ? error.message : error);
  }

  // A fetch failure (or Speedy not configured yet) falls back to whatever
  // was cached before, even if stale, rather than leaving the picker empty.
  return stored?.offices ?? [];
}
