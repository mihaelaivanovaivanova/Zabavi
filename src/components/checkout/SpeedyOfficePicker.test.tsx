import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SETTLEMENTS = [
  { id: "1", type: "гр.", name: "Варна", municipality: "Варна", region: "Варна", postalCode: "9000" },
  { id: "2", type: "гр.", name: "София", municipality: "София", region: "София", postalCode: "1000" },
];

const VARNA_OFFICES = [
  { id: "O1", name: "Офис Център", city: "Варна", address: "ул. Тест 1" },
  { id: "O2", name: "Офис Запад", city: "Варна", address: "ул. Тест 2" },
];

function mockFetches() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/content/settlements")) {
        return Promise.resolve(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 }));
      }
      if (url.includes("/api/shipping/speedy/offices")) {
        const requestedCity = new URL(url, "http://localhost").searchParams.get("city");
        const offices = requestedCity === "Варна" ? VARNA_OFFICES : [];
        return Promise.resolve(new Response(JSON.stringify({ offices }), { status: 200 }));
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    }),
  );
}

beforeEach(() => {
  // useSettlements caches its result at module scope for the page's whole
  // lifetime (see useSettlements.ts) — reset it between tests so each
  // test's own fetch mock is actually exercised.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpeedyOfficePicker", () => {
  it("disables the office field until a city is chosen", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Офис")).toBeDisabled());
  });

  it("fetches and lists only the offices for the chosen city", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    await waitFor(() => expect(screen.getByLabelText("Офис")).not.toBeDisabled());
    fireEvent.focus(screen.getByLabelText("Офис"));
    expect(screen.getByRole("option", { name: "Офис Център — ул. Тест 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Офис Запад — ул. Тест 2" })).toBeInTheDocument();
  });

  it("labels the second field 'Автомат' for the locker type", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="locker" selected={null} onSelect={() => {}} />);

    expect(screen.getByLabelText("Автомат")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen office's id, label and city", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    const onSelect = vi.fn();
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    await waitFor(() => expect(screen.getByLabelText("Офис")).not.toBeDisabled());
    fireEvent.focus(screen.getByLabelText("Офис"));
    fireEvent.click(screen.getByRole("option", { name: "Офис Център — ул. Тест 1" }));

    expect(onSelect).toHaveBeenLastCalledWith({ officeId: "O1", officeLabel: "Офис Център — ул. Тест 1", city: "Варна" });
  });

  it("clears the previous office selection when the city is changed", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    const onSelect = vi.fn();
    render(<SpeedyOfficePicker type="office" selected={{ officeId: "O1", officeLabel: "Офис Център — ул. Тест 1", city: "Варна" }} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "София" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("allows a Latin-typed city search to find a Cyrillic settlement", async () => {
    mockFetches();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    const cityInput = screen.getByLabelText("Град");
    fireEvent.focus(cityInput);
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.change(cityInput, { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
  });

  it("shows a loading message in the city field instead of 'no matches' while settlements are still being fetched", async () => {
    // A promise that never resolves during this test — simulates the city
    // field being opened before the real (~5,300-row, a couple of seconds
    // on a cold first load) settlements fetch has come back.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByText("Зареждане…")).toBeInTheDocument();
    expect(screen.queryByText("Няма съвпадения.")).not.toBeInTheDocument();
  });

  it("reuses the already-fetched settlements on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");

    const first = render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    first.unmount();

    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error message (not a perpetual loading state) when the settlements request succeeds with an empty list", async () => {
    // e.g. the server's own getSettlements() falls back to [] with a 200,
    // not a failed response, if Speedy isn't configured there yet.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: [] }), { status: 200 })));
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText("Зареждане…")).not.toBeInTheDocument();
  });
});
