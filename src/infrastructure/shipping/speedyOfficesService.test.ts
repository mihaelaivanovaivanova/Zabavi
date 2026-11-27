import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeedyOffice } from "@/infrastructure/shipping/speedyApiClient";

const getMock = vi.fn();
const saveMock = vi.fn();
const searchSpeedyOfficesMock = vi.fn();

vi.mock("@/infrastructure/settings/settingsRepository", () => ({
  settingsRepository: { get: getMock, save: saveMock },
}));
vi.mock("@/infrastructure/shipping/speedyApiClient", () => ({
  searchSpeedyOffices: searchSpeedyOfficesMock,
}));

const sample: SpeedyOffice[] = [{ id: "1", type: "office", name: "Офис Център", city: "Варна", address: "ул. Тест 1" }];

beforeEach(() => {
  getMock.mockReset();
  saveMock.mockReset();
  searchSpeedyOfficesMock.mockReset();
});

describe("getAllSpeedyOffices", () => {
  it("fetches (unfiltered by city) and caches the list when nothing is stored yet", async () => {
    getMock.mockResolvedValue(null);
    searchSpeedyOfficesMock.mockResolvedValue(sample);

    const { getAllSpeedyOffices } = await import("@/infrastructure/shipping/speedyOfficesService");
    const result = await getAllSpeedyOffices();

    expect(result).toEqual(sample);
    expect(searchSpeedyOfficesMock).toHaveBeenCalledWith();
    expect(saveMock).toHaveBeenCalledWith("speedy_offices", expect.objectContaining({ offices: sample }));
  });

  it("reuses a fresh cached list without calling Speedy again", async () => {
    getMock.mockResolvedValue({ fetchedAt: new Date().toISOString(), offices: sample });

    const { getAllSpeedyOffices } = await import("@/infrastructure/shipping/speedyOfficesService");
    const result = await getAllSpeedyOffices();

    expect(result).toEqual(sample);
    expect(searchSpeedyOfficesMock).not.toHaveBeenCalled();
  });

  it("refreshes a stale cached list", async () => {
    const stale = [{ ...sample[0], name: "Стар запис" }];
    getMock.mockResolvedValue({ fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), offices: stale });
    searchSpeedyOfficesMock.mockResolvedValue(sample);

    const { getAllSpeedyOffices } = await import("@/infrastructure/shipping/speedyOfficesService");
    const result = await getAllSpeedyOffices();

    expect(result).toEqual(sample);
  });

  it("falls back to a stale cache when refreshing fails", async () => {
    const stale = sample;
    getMock.mockResolvedValue({ fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), offices: stale });
    searchSpeedyOfficesMock.mockRejectedValue(new Error("Speedy is down"));

    const { getAllSpeedyOffices } = await import("@/infrastructure/shipping/speedyOfficesService");
    const result = await getAllSpeedyOffices();

    expect(result).toEqual(stale);
  });

  it("returns an empty list when nothing is cached and the fetch fails", async () => {
    getMock.mockResolvedValue(null);
    searchSpeedyOfficesMock.mockRejectedValue(new Error("Speedy credentials are not configured."));

    const { getAllSpeedyOffices } = await import("@/infrastructure/shipping/speedyOfficesService");
    expect(await getAllSpeedyOffices()).toEqual([]);
  });
});
