import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "@/lib/CartContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("CartContext", () => {
  it("starts empty and closed", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.item).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it("addToCart stores the item in state and persists it to localStorage", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart("christmas-magic", 2);
    });

    expect(result.current.item).toEqual({ variantId: "christmas-magic", quantity: 2 });
    await waitFor(() =>
      expect(window.localStorage.getItem("zabavi-cart")).toBe(
        JSON.stringify({ variantId: "christmas-magic", quantity: 2 }),
      ),
    );
  });

  it("addToCart replaces any existing item (single-product cart)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart("christmas-magic", 2));
    act(() => result.current.addToCart("calm-moments", 1));

    expect(result.current.item).toEqual({ variantId: "calm-moments", quantity: 1 });
  });

  it("hydrates an existing cart from localStorage on mount", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "calm-moments", quantity: 3 }));

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.item).toEqual({ variantId: "calm-moments", quantity: 3 }));
  });

  it("ignores corrupt localStorage content and starts with an empty cart", async () => {
    window.localStorage.setItem("zabavi-cart", "{not-json");

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.item).toBeNull());
  });

  it("clearCart empties the item and removes it from localStorage", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart("christmas-magic", 1));
    await waitFor(() => expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull());

    act(() => result.current.clearCart());

    expect(result.current.item).toBeNull();
    expect(window.localStorage.getItem("zabavi-cart")).toBeNull();
  });

  it("openCart and closeCart toggle isOpen", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.openCart());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.closeCart());
    expect(result.current.isOpen).toBe(false);
  });

  it("throws when used outside a CartProvider", () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  });
});
