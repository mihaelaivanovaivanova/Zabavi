"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SelectedVariantContextValue {
  selectedVariantId: string;
  setSelectedVariantId: (variantId: string) => void;
}

const SelectedVariantContext = createContext<SelectedVariantContextValue | null>(null);

/** Shares which kit tab is selected on the landing page between `Hero` (which owns the tab control) and other sections (e.g. `IllustrationsShowcase`) that vary their content by kit. */
export function SelectedVariantProvider({
  defaultVariantId,
  children,
}: {
  defaultVariantId: string;
  children: ReactNode;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);
  return (
    <SelectedVariantContext.Provider value={{ selectedVariantId, setSelectedVariantId }}>
      {children}
    </SelectedVariantContext.Provider>
  );
}

export function useSelectedVariant() {
  const context = useContext(SelectedVariantContext);
  if (!context) throw new Error("useSelectedVariant must be used within a SelectedVariantProvider");
  return context;
}
