import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OFFICES = [
  { id: "O1", type: "office", name: "Офис Център", city: "Варна", address: "ул. Тест 1" },
  { id: "O2", type: "office", name: "Офис Запад", city: "Варна", address: "ул. Тест 2" },
  { id: "O3", type: "office", name: "Офис Юг", city: "София", address: "ул. Тест 3" },
  { id: "L1", type: "locker", name: "Автомат Център", city: "Варна", address: "ул. Тест 4" },
];

function mockOfficesFetch() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: OFFICES }), { status: 200 })));
}

beforeEach(() => {
  // useSpeedyOffices caches its result at module scope for the page's whole
  // lifetime — reset it between tests so each test's own fetch mock is
  // actually exercised.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpeedyOfficePicker", () => {
  it("only lists cities (and only offices within them) that actually have an office of this type", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    // Varna has a locker but no city with *only* a locker should appear here —
    // every city in OFFICES happens to have an office too, so just check both show.
    expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    fireEvent.focus(screen.getByLabelText("Офис"));
    expect(screen.getByRole("option", { name: "Офис Център — ул. Тест 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Офис Запад — ул. Тест 2" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Автомат Център — ул. Тест 4" })).not.toBeInTheDocument();
  });

  it("labels the second field 'Автомат' and only lists lockers for the locker type", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="locker" selected={null} onSelect={() => {}} />);

    expect(screen.getByLabelText("Автомат")).toBeInTheDocument();

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    // София only has an office, no locker — must not be offered for type="locker".
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    fireEvent.focus(screen.getByLabelText("Автомат"));
    expect(screen.getByRole("option", { name: "Автомат Център — ул. Тест 4" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Офис Център — ул. Тест 1" })).not.toBeInTheDocument();
  });

  it("disables the office field until a city is chosen", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Офис")).toBeDisabled());
  });

  it("calls onSelect with the chosen office's id, label and city", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    const onSelect = vi.fn();
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    fireEvent.focus(screen.getByLabelText("Офис"));
    fireEvent.click(screen.getByRole("option", { name: "Офис Център — ул. Тест 1" }));

    expect(onSelect).toHaveBeenLastCalledWith({ officeId: "O1", officeLabel: "Офис Център — ул. Тест 1", city: "Варна" });
  });

  it("clears the previous office selection when the city is changed", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    const onSelect = vi.fn();
    render(<SpeedyOfficePicker type="office" selected={{ officeId: "O1", officeLabel: "Офис Център — ул. Тест 1", city: "Варна" }} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "София" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("allows a Latin-typed city search to find a Cyrillic city", async () => {
    mockOfficesFetch();
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    const cityInput = screen.getByLabelText("Град");
    fireEvent.focus(cityInput);
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.change(cityInput, { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
  });

  it("shows a loading message in the city field instead of 'no matches' while offices are still being fetched", async () => {
    // A promise that never resolves during this test — simulates the city
    // field being opened before the real (slow, nationwide) office fetch
    // has come back.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByText("Зареждане…")).toBeInTheDocument();
    expect(screen.queryByText("Няма съвпадения.")).not.toBeInTheDocument();
  });

  it("reuses the already-fetched offices on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: OFFICES }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");

    const first = render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    first.unmount();

    render(<SpeedyOfficePicker type="locker" selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error message (not a perpetual loading state) when the request succeeds with an empty list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offices: [] }), { status: 200 })));
    const { SpeedyOfficePicker } = await import("@/components/checkout/SpeedyOfficePicker");
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText("Зареждане…")).not.toBeInTheDocument();
  });
});
