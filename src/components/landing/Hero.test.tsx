import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { CartProvider } from "@/lib/CartContext";
import { SelectedVariantProvider } from "@/lib/SelectedVariantContext";

// jsdom has no IntersectionObserver implementation; Hero only uses it to
// toggle the sticky buy bar, which isn't under test here.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ kits: [] }), { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function renderHero() {
  return render(
    <CartProvider>
      <SelectedVariantProvider defaultVariantId="christmas-magic">
        <Hero />
      </SelectedVariantProvider>
    </CartProvider>,
  );
}

describe("Hero — add to cart", () => {
  it("adds the active variant and quantity to the cart without navigating away", async () => {
    renderHero();

    fireEvent.click(screen.getByRole("button", { name: "Добави в количката" }));

    expect(window.location.pathname).toBe("/");
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem("zabavi-cart") ?? "{}")).toEqual({
        variantId: "christmas-magic",
        quantity: 1,
      }),
    );
  });

  it("shows a confirmation label that reverts after a couple of seconds", () => {
    vi.useFakeTimers();
    renderHero();

    fireEvent.click(screen.getByRole("button", { name: "Добави в количката" }));
    expect(screen.getByRole("button", { name: "Добавено ✓" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Добави в количката" })).toBeInTheDocument();
  });

  it("adds whichever variant is currently selected", async () => {
    renderHero();

    fireEvent.click(screen.getByRole("tab", { name: "Извън очертанията" }));
    fireEvent.click(screen.getByRole("button", { name: "Добави в количката" }));

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem("zabavi-cart") ?? "{}")).toMatchObject({
        variantId: "calm-moments",
      }),
    );
  });

  it("adds the quantity selected on the price card, not always 1", async () => {
    renderHero();

    fireEvent.click(screen.getByRole("button", { name: "Увеличи количеството" }));
    fireEvent.click(screen.getByRole("button", { name: "Добави в количката" }));

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem("zabavi-cart") ?? "{}")).toMatchObject({ quantity: 2 }),
    );
  });
});
