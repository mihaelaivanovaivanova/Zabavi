"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface CartItem {
  variantId: string;
  quantity: number;
}

interface CartContextValue {
  item: CartItem | null;
  addToCart: (variantId: string, quantity: number) => void;
  setItemQuantity: (quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "zabavi-cart";
const MAX_QUANTITY = 10;

export function CartProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<CartItem | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Deferred to a microtask so the initial read doesn't set state
    // synchronously within the effect body (matches the async-callback
    // pattern used by the kits fetch in useKits.ts).
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setItem(JSON.parse(raw));
      } catch {
        // Ignore corrupt/inaccessible storage — cart just starts empty.
      }
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (item) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [item, isHydrated]);

  // Memoized so consumers can safely depend on these in their own effects —
  // without this, a new function identity on every CartProvider render would
  // re-fire any effect that lists one of these as a dependency.
  //
  // Adding the same variant again (e.g. clicking "Добави в количката"
  // repeatedly) increases the existing quantity instead of resetting it;
  // adding a different variant replaces the cart, since it only ever holds
  // one line. Opens the drawer so the person sees what just happened.
  const addToCart = useCallback((variantId: string, quantity: number) => {
    setItem((current) =>
      current && current.variantId === variantId
        ? { variantId, quantity: Math.min(MAX_QUANTITY, current.quantity + quantity) }
        : { variantId, quantity },
    );
    setIsOpen(true);
  }, []);

  // Sets the cart's quantity to an exact value — what the drawer's own
  // +/- stepper needs, as distinct from addToCart's "add more" semantics.
  const setItemQuantity = useCallback((quantity: number) => {
    setItem((current) => (current ? { ...current, quantity } : current));
  }, []);

  const clearCart = useCallback(() => {
    setItem(null);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CartContext.Provider value={{ item, addToCart, setItemQuantity, clearCart, isOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
