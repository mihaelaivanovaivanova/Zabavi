import { act, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Objections } from "@/components/landing/Objections";
import { objections } from "@/config/site";

function mockFetch(items: Array<{ question: string; answer: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: { items } }), { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Objections", () => {
  it("renders the admin-edited replies instead of the config defaults", async () => {
    mockFetch([{ question: "…админ възражение?", answer: "Админ отговор." }]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Objections />);

    // Rendered twice by design: once in the mobile one-at-a-time view, once
    // in the always-show-everything desktop/tablet view.
    await vi.waitFor(() => expect(screen.getAllByText("…админ възражение?").length).toBeGreaterThan(0));
    act(() => {
      vi.advanceTimersByTime(2000); // the mobile view's answer only reveals after a short delay — see below.
    });
    expect(screen.getAllByText("Админ отговор.").length).toBeGreaterThan(0);
    expect(screen.queryByText(objections[0].question)).not.toBeInTheDocument();
  });

  it("falls back to the config default replies when nothing is saved yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<Objections />);

    await waitFor(() => expect(screen.getAllByText(objections[0].question).length).toBeGreaterThan(0));
  });

  it("shows only the first question/answer pair in the mobile view initially", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Objections />);

    await vi.waitFor(() => expect(screen.getByTestId("objection-current")).toBeInTheDocument());
    const mobileView = within(screen.getByTestId("objection-current"));
    expect(mobileView.getByText(objections[0].question)).toBeInTheDocument();
    expect(mobileView.queryByText(objections[1].question)).not.toBeInTheDocument();
  });

  it("keeps the answer's space reserved but invisible before it reveals, so the section height never grows", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Objections />);

    await vi.waitFor(() => expect(screen.getByTestId("objection-current")).toBeInTheDocument());
    const mobileView = within(screen.getByTestId("objection-current"));
    expect(mobileView.getByText(objections[0].question)).toBeInTheDocument();
    // Already in the document (reserving its layout space) — just visually hidden.
    expect(screen.getByTestId("objection-answer")).toHaveClass("invisible");
    expect(mobileView.getByText(objections[0].answer)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("objection-answer")).not.toHaveClass("invisible");
  });

  it("keeps every pair's own space reserved (invisible, not unmounted) so the section's height is one constant value across all of them", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<Objections />);

    await waitFor(() => expect(screen.getByTestId("objection-current")).toBeInTheDocument());
    // Every other pair is still in the document — just marked inactive/invisible —
    // instead of being unmounted, which is what lets the grid size itself to
    // the tallest pair regardless of which one is currently showing.
    const otherQuestion = within(screen.getByTestId("objection-mobile-grid")).getByText(objections[1].question);
    const otherPair = otherQuestion.closest("[data-active]");
    expect(otherPair).toHaveAttribute("data-active", "false");
    expect(otherPair).toHaveClass("invisible");
  });

  it("keeps the answer visible for 6 seconds after it reveals, then advances to the next pair", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    // Fully fake (no shouldAdvanceTime): this test chains several precise
    // advances, and letting real time tick alongside them makes the exact
    // boundary assertions below flaky.
    vi.useFakeTimers();
    render(<Objections />);

    await vi.waitFor(() => expect(screen.getByTestId("objection-current")).toBeInTheDocument());
    expect(within(screen.getByTestId("objection-current")).getByText(objections[0].question)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000); // the answer reveals
    });
    expect(screen.getByTestId("objection-answer")).not.toHaveClass("invisible");

    act(() => {
      vi.advanceTimersByTime(5500); // well under 6s after the reveal (7.5s total) — still the same pair
    });
    expect(within(screen.getByTestId("objection-current")).getByText(objections[0].question)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000); // now well past the 6s-after-reveal mark (8.5s total)
    });
    expect(within(screen.getByTestId("objection-current")).getByText(objections[1].question)).toBeInTheDocument();
  });
});
