import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SETTLEMENTS = [
  { id: "1", type: "гр.", name: "Варна", municipality: "Варна", region: "Варна", postalCode: "9000" },
  { id: "2", type: "с.", name: "Variant village", municipality: "Варна", region: "Варна", postalCode: "9100" },
];

function mockSettlementsFetch() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 })));
}

beforeEach(() => {
  // useSettlements caches its result at module scope for the page's whole
  // lifetime (see useSettlements.ts) — reset it between tests so each one's
  // own fetch mock is actually exercised, not short-circuited by a previous
  // test's cached (and possibly differently-mocked) result.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettlementPicker", () => {
  it("lists settlements once loaded and calls onSelect with the formatted label and postal code", async () => {
    mockSettlementsFetch();
    const { SettlementPicker } = await import("@/components/checkout/SettlementPicker");
    const onSelect = vi.fn();
    render(<SettlementPicker value="" onSelect={onSelect} />);

    fireEvent.focus(screen.getByLabelText("Населено място"));
    await waitFor(() => expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" }));

    expect(onSelect).toHaveBeenCalledWith({ label: "гр. Варна (общ. Варна, обл. Варна)", postalCode: "9000" });
  });

  it("matches a Latin-typed query against the settlement's own name, not its whole disambiguated label", async () => {
    mockSettlementsFetch();
    const { SettlementPicker } = await import("@/components/checkout/SettlementPicker");
    render(<SettlementPicker value="" onSelect={() => {}} />);

    const input = screen.getByLabelText("Населено място");
    fireEvent.focus(input);
    await waitFor(() => expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument());
    fireEvent.change(input, { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument();
  });

  it("shows an error message when the settlements request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const { SettlementPicker } = await import("@/components/checkout/SettlementPicker");
    render(<SettlementPicker value="" onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("shows a loading message instead of 'no matches' while settlements are still being fetched", async () => {
    // A promise that never resolves during this test — simulates the field
    // being opened before the real (~5,300-row, a couple of seconds on a
    // cold first load) settlements fetch has come back.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { SettlementPicker } = await import("@/components/checkout/SettlementPicker");
    render(<SettlementPicker value="" onSelect={() => {}} />);

    fireEvent.focus(screen.getByLabelText("Населено място"));
    expect(screen.getByText("Зареждане…")).toBeInTheDocument();
    expect(screen.queryByText("Няма съвпадения.")).not.toBeInTheDocument();
  });

  it("reuses the already-fetched settlements on a later mount instead of fetching again", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { SettlementPicker } = await import("@/components/checkout/SettlementPicker");

    const first = render(<SettlementPicker value="" onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Населено място"));
    await waitFor(() => expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument());
    first.unmount();

    render(<SettlementPicker value="" onSelect={() => {}} />);
    fireEvent.focus(screen.getByLabelText("Населено място"));
    expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
