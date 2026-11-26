import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SETTLEMENTS = [{ id: "1", type: "гр.", name: "Варна", municipality: "Варна", region: "Варна", postalCode: "9000" }];

beforeEach(() => {
  // The cache is module-level (by design — see useSettlements.ts), so each
  // test needs its own fresh module instance to avoid leaking state between
  // cases in this file.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSettlements", () => {
  it("fetches and returns the settlement list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 })));
    const { useSettlements } = await import("@/lib/useSettlements");

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => expect(result.current.settlements).toEqual(SETTLEMENTS));
    expect(result.current.loadError).toBe(false);
  });

  it("reuses the already-fetched list on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { useSettlements } = await import("@/lib/useSettlements");

    const first = renderHook(() => useSettlements());
    await waitFor(() => expect(first.result.current.settlements).toEqual(SETTLEMENTS));
    first.unmount();

    // A fresh mount (e.g. switching delivery methods and back) should have
    // the list immediately, with no further network request.
    const second = renderHook(() => useSettlements());
    expect(second.result.current.settlements).toEqual(SETTLEMENTS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sets loadError when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const { useSettlements } = await import("@/lib/useSettlements");

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.settlements).toEqual([]);
  });

  it("reports isLoading true until the fetch resolves, then false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 })));
    const { useSettlements } = await import("@/lib/useSettlements");

    const { result } = renderHook(() => useSettlements());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("reports isLoading false once the request has failed, instead of loading forever", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const { useSettlements } = await import("@/lib/useSettlements");

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });
});
