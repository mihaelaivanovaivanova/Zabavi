import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeedyOfficePicker } from "@/components/checkout/SpeedyOfficePicker";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpeedyOfficePicker", () => {
  it("disables the office field until a city is chosen", async () => {
    mockFetches();
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Офис")).toBeDisabled());
  });

  it("fetches and lists only the offices for the chosen city", async () => {
    mockFetches();
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
    render(<SpeedyOfficePicker type="locker" selected={null} onSelect={() => {}} />);

    expect(screen.getByLabelText("Автомат")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen office's id, label and city", async () => {
    mockFetches();
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
    const onSelect = vi.fn();
    render(<SpeedyOfficePicker type="office" selected={{ officeId: "O1", officeLabel: "Офис Център — ул. Тест 1", city: "Варна" }} onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Град"));
    await waitFor(() => expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "София" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("allows a Latin-typed city search to find a Cyrillic settlement", async () => {
    mockFetches();
    render(<SpeedyOfficePicker type="office" selected={null} onSelect={() => {}} />);

    const cityInput = screen.getByLabelText("Град");
    fireEvent.focus(cityInput);
    await waitFor(() => expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument());
    fireEvent.change(cityInput, { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
  });
});
