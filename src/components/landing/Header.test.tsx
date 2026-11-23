import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/landing/Header";
import { CartProvider } from "@/lib/CartContext";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ kits: [] }), { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Header", () => {
  it("shows no cart count badge when the cart is empty", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>,
    );

    expect(screen.getByRole("button", { name: "Количка" })).toBeInTheDocument();
  });

  it("opens the cart drawer instead of navigating when the cart button is clicked", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>,
    );

    expect(screen.queryByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-full");

    fireEvent.click(screen.getByRole("button", { name: "Количка" }));

    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-0");
  });

  it("shows the item count once the persisted cart hydrates", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 2 }));

    render(
      <CartProvider>
        <Header />
      </CartProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Количка — 2 бр." })).toBeInTheDocument(),
    );
  });
});
