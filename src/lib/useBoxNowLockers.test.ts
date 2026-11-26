import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LOCKERS = [{ id: "L1", city: "Варна", addressLine1: "ул. Тест 1", postalCode: "9000", name: "Локер А" }];

beforeEach(() => {
  // The cache is module-level (by design — see useBoxNowLockers.ts), so
  // each test needs its own fresh module instance to avoid leaking state
  // between cases in this file.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBoxNowLockers", () => {
  it("fetches and returns the locker list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: LOCKERS }), { status: 200 })));
    const { useBoxNowLockers } = await import("@/lib/useBoxNowLockers");

    const { result } = renderHook(() => useBoxNowLockers());

    await waitFor(() => expect(result.current.lockers).toEqual(LOCKERS));
    expect(result.current.loadError).toBe(false);
  });

  it("reuses the already-fetched list on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: LOCKERS }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { useBoxNowLockers } = await import("@/lib/useBoxNowLockers");

    const first = renderHook(() => useBoxNowLockers());
    await waitFor(() => expect(first.result.current.lockers).toEqual(LOCKERS));
    first.unmount();

    // A fresh mount (e.g. switching delivery methods and back) should have
    // the list immediately, with no further network request.
    const second = renderHook(() => useBoxNowLockers());
    expect(second.result.current.lockers).toEqual(LOCKERS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sets loadError when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const { useBoxNowLockers } = await import("@/lib/useBoxNowLockers");

    const { result } = renderHook(() => useBoxNowLockers());

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.lockers).toEqual([]);
  });

  it("reports isLoading true until the fetch resolves, then false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: LOCKERS }), { status: 200 })));
    const { useBoxNowLockers } = await import("@/lib/useBoxNowLockers");

    const { result } = renderHook(() => useBoxNowLockers());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("treats a successful-but-empty response as a load error, not perpetual loading", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: [] }), { status: 200 })));
    const { useBoxNowLockers } = await import("@/lib/useBoxNowLockers");

    const { result } = renderHook(() => useBoxNowLockers());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe(true);
    expect(result.current.lockers).toEqual([]);
  });
});
