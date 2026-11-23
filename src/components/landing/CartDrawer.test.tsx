import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartDrawer } from "@/components/landing/CartDrawer";
import { CartProvider, useCart } from "@/lib/CartContext";

/** Opens the drawer as soon as it mounts, standing in for clicking the header's cart button. */
function OpenCartOnMount() {
  const { openCart } = useCart();
  useEffect(() => {
    openCart();
  }, [openCart]);
  return null;
}

function mockKitsResponse(
  kits: Array<{ variantId: string; priceEur: number | null; compareAtPriceEur?: number | null }>,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          kits: kits.map((k) => ({
            variantId: k.variantId,
            priceEur: k.priceEur,
            compareAtPriceEur: k.compareAtPriceEur ?? null,
            coverImage: null,
            gallery: [],
            updatedAt: new Date(0).toISOString(),
          })),
        }),
        { status: 200 },
      ),
    ),
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CartDrawer", () => {
  it("shows an empty-cart message and a link back to the catalog when there is no item", () => {
    mockKitsResponse([]);
    render(
      <CartProvider>
        <CartDrawer />
      </CartProvider>,
    );

    expect(screen.getByText("Количката е празна.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Разгледай комплектите" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Продължи към плащане" })).not.toBeInTheDocument();
  });

  it("shows the product, variant label and line total once an item is in the cart", async () => {
    mockKitsResponse([{ variantId: "christmas-magic", priceEur: 44.99 }]);
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 2 }));

    render(
      <CartProvider>
        <CartDrawer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByText("Магията на Коледа")).toBeInTheDocument());
    // "89.98 €" (44.99 × 2) appears twice: once as the line total, once as the cart total.
    expect(screen.getAllByText("89.98 €")).toHaveLength(2);
    expect(screen.getByText("Общо")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Продължи към плащане" })).toHaveAttribute("href", "/checkout");
  });

  it("never fabricates a total when the kit price is not confirmed yet", async () => {
    mockKitsResponse([{ variantId: "christmas-magic", priceEur: null }]);
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));

    render(
      <CartProvider>
        <CartDrawer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByText("Магията на Коледа")).toBeInTheDocument());
    expect(screen.getAllByText("предстои да се зададе").length).toBeGreaterThan(0);
  });

  it("updates the quantity through the stepper", async () => {
    mockKitsResponse([{ variantId: "christmas-magic", priceEur: 44.99 }]);
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));

    render(
      <CartProvider>
        <CartDrawer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByText("Магията на Коледа")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Увеличи количеството" }));

    await waitFor(() => expect(screen.getAllByText("89.98 €")).toHaveLength(2));
    expect(window.localStorage.getItem("zabavi-cart")).toBe(
      JSON.stringify({ variantId: "christmas-magic", quantity: 2 }),
    );
  });

  it("removes the item from the cart when the trash button is clicked", async () => {
    mockKitsResponse([{ variantId: "christmas-magic", priceEur: 44.99 }]);
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));

    render(
      <CartProvider>
        <CartDrawer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByText("Магията на Коледа")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Премахни от количката" }));

    expect(screen.getByText("Количката е празна.")).toBeInTheDocument();
    expect(window.localStorage.getItem("zabavi-cart")).toBeNull();
  });

  it("closes when the × button is clicked", () => {
    mockKitsResponse([]);
    render(
      <CartProvider>
        <OpenCartOnMount />
        <CartDrawer />
      </CartProvider>,
    );

    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-0");
    fireEvent.click(screen.getByRole("button", { name: "Затвори количката" }));
    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-full");
  });

  it("closes when the backdrop is clicked", () => {
    mockKitsResponse([]);
    const { container } = render(
      <CartProvider>
        <OpenCartOnMount />
        <CartDrawer />
      </CartProvider>,
    );

    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-0");
    fireEvent.click(container.querySelector('[aria-hidden="true"].fixed.inset-0')!);
    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-full");
  });

  it("closes when 'Продължи към плащане' is clicked", async () => {
    mockKitsResponse([{ variantId: "christmas-magic", priceEur: 44.99 }]);
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));

    render(
      <CartProvider>
        <OpenCartOnMount />
        <CartDrawer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-0"));
    fireEvent.click(screen.getByRole("link", { name: "Продължи към плащане" }));
    expect(screen.getByRole("dialog", { name: "Количка" })).toHaveClass("translate-x-full");
  });
});
