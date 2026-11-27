import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OFFICES = [{ id: "O1", type: "office", name: "Офис Център", city: "Варна", address: "ул. Тест 1" }];

beforeEach(() => {
  // The cache is module-level (by design — see useSpeedyOffices.ts), so
  // each test needs its own fresh module instance to avoid leaking state
  // between cases in this file.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSpeedyOffices", () => {
  it("fetches and returns the office list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: OFFICES }), { status: 200 })));
    const { useSpeedyOffices } = await import("@/lib/useSpeedyOffices");

    const { result } = renderHook(() => useSpeedyOffices());

    await waitFor(() => expect(result.current.offices).toEqual(OFFICES));
    expect(result.current.loadError).toBe(false);
  });

  it("reuses the already-fetched list on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: OFFICES }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { useSpeedyOffices } = await import("@/lib/useSpeedyOffices");

    const first = renderHook(() => useSpeedyOffices());
    await waitFor(() => expect(first.result.current.offices).toEqual(OFFICES));
    first.unmount();

    // A fresh mount (e.g. switching between "Speedy" and "Speedy (автомат)")
    // should have the list immediately, with no further network request.
    const second = renderHook(() => useSpeedyOffices());
    expect(second.result.current.offices).toEqual(OFFICES);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sets loadError when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const { useSpeedyOffices } = await import("@/lib/useSpeedyOffices");

    const { result } = renderHook(() => useSpeedyOffices());

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.offices).toEqual([]);
  });

  it("reports isLoading true until the fetch resolves, then false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: OFFICES }), { status: 200 })));
    const { useSpeedyOffices } = await import("@/lib/useSpeedyOffices");

    const { result } = renderHook(() => useSpeedyOffices());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("treats a successful-but-empty response as a load error, not perpetual loading", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: [] }), { status: 200 })));
    const { useSpeedyOffices } = await import("@/lib/useSpeedyOffices");

    const { result } = renderHook(() => useSpeedyOffices());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe(true);
    expect(result.current.offices).toEqual([]);
  });
});
