import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LOCKERS = [
  { id: "L1", city: "София", addressLine1: "бул. Тест 1", postalCode: "1000", name: "Локер А" },
  { id: "L2", city: "София", addressLine1: "бул. Тест 2", postalCode: "1000", name: "Локер Б" },
  { id: "L3", city: "Варна", addressLine1: "ул. Тест 3", postalCode: "9000", name: "Локер В" },
];

function mockLockersFetch() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: LOCKERS }), { status: 200 })));
}

beforeEach(() => {
  // useBoxNowLockers caches its result at module scope for the page's whole
  // lifetime — reset it between tests so each test's own fetch mock is
  // actually exercised.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BoxNowLockerPicker", () => {
  it("only lists lockers from the chosen city, in the second field", async () => {
    mockLockersFetch();
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "София" }));

    fireEvent.focus(screen.getByLabelText("Автомат"));
    expect(screen.getByRole("option", { name: "Локер А — бул. Тест 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Локер Б — бул. Тест 2" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Локер В — ул. Тест 3" })).not.toBeInTheDocument();
  });

  it("disables the locker field until a city is chosen", async () => {
    mockLockersFetch();
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Автомат")).toBeDisabled());
  });

  it("calls onSelect with the chosen locker's id, address and postal code", async () => {
    mockLockersFetch();
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    const onSelect = vi.fn();
    render(<BoxNowLockerPicker selected={null} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    fireEvent.focus(screen.getByLabelText("Автомат"));
    fireEvent.click(screen.getByRole("option", { name: "Локер В — ул. Тест 3" }));

    expect(onSelect).toHaveBeenLastCalledWith({ lockerId: "L3", addressLine1: "ул. Тест 3, Варна", postalCode: "9000" });
  });

  it("clears the previous locker selection when the city is changed", async () => {
    mockLockersFetch();
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    const onSelect = vi.fn();
    render(<BoxNowLockerPicker selected={{ lockerId: "L1", addressLine1: "бул. Тест 1, София", postalCode: "1000" }} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("allows a Latin-typed city search to find a Cyrillic city", async () => {
    mockLockersFetch();
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);

    const cityInput = screen.getByLabelText("Град");
    fireEvent.focus(cityInput);
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.change(cityInput, { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
  });

  it("shows a loading message instead of 'no matches' while the lockers are still being fetched", async () => {
    // A promise that never resolves during this test — simulates the city
    // field being opened before the real (slow, ~5,300-settlement-sized for
    // Speedy, ~900-row for BOX NOW) fetch has come back.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");
    render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByText("Зареждане…")).toBeInTheDocument();
    expect(screen.queryByText("Няма съвпадения.")).not.toBeInTheDocument();
  });

  it("reuses the already-fetched lockers on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: LOCKERS }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { BoxNowLockerPicker } = await import("@/components/checkout/BoxNowLockerPicker");

    const first = render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    first.unmount();

    render(<BoxNowLockerPicker selected={null} onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Град"));
    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
