import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeedySettlement } from "@/infrastructure/shipping/speedyApiClient";

const getMock = vi.fn();
const saveMock = vi.fn();
const fetchSpeedySettlementsMock = vi.fn();

vi.mock("@/infrastructure/settings/settingsRepository", () => ({
  settingsRepository: { get: getMock, save: saveMock },
}));
vi.mock("@/infrastructure/shipping/speedyApiClient", () => ({
  fetchSpeedySettlements: fetchSpeedySettlementsMock,
}));

const sample: SpeedySettlement[] = [
  { id: "1", type: "гр.", name: "София", municipality: "Столична", region: "София-град", postalCode: "1000" },
];

beforeEach(() => {
  getMock.mockReset();
  saveMock.mockReset();
  fetchSpeedySettlementsMock.mockReset();
});

describe("getSettlements", () => {
  it("fetches and caches the list when nothing is stored yet", async () => {
    getMock.mockResolvedValue(null);
    fetchSpeedySettlementsMock.mockResolvedValue(sample);

    const { getSettlements } = await import("@/infrastructure/content/settlementsService");
    const result = await getSettlements();

    expect(result).toEqual(sample);
    expect(saveMock).toHaveBeenCalledWith("speedy_settlements", expect.objectContaining({ settlements: sample }));
  });

  it("reuses a fresh cached list without calling Speedy again", async () => {
    getMock.mockResolvedValue({ fetchedAt: new Date().toISOString(), settlements: sample });

    const { getSettlements } = await import("@/infrastructure/content/settlementsService");
    const result = await getSettlements();

    expect(result).toEqual(sample);
    expect(fetchSpeedySettlementsMock).not.toHaveBeenCalled();
  });

  it("refreshes a stale cached list", async () => {
    const stale = [{ ...sample[0], name: "Стар запис" }];
    getMock.mockResolvedValue({ fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), settlements: stale });
    fetchSpeedySettlementsMock.mockResolvedValue(sample);

    const { getSettlements } = await import("@/infrastructure/content/settlementsService");
    const result = await getSettlements();

    expect(result).toEqual(sample);
  });

  it("falls back to a stale cache when refreshing fails", async () => {
    const stale = sample;
    getMock.mockResolvedValue({ fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), settlements: stale });
    fetchSpeedySettlementsMock.mockRejectedValue(new Error("Speedy is down"));

    const { getSettlements } = await import("@/infrastructure/content/settlementsService");
    const result = await getSettlements();

    expect(result).toEqual(stale);
  });

  it("returns an empty list when nothing is cached and the fetch fails", async () => {
    getMock.mockResolvedValue(null);
    fetchSpeedySettlementsMock.mockRejectedValue(new Error("Speedy credentials are not configured."));

    const { getSettlements } = await import("@/infrastructure/content/settlementsService");
    expect(await getSettlements()).toEqual([]);
  });
});
