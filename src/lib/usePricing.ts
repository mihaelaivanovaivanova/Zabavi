"use client";

import { useEffect, useState } from "react";
import type { ShippingPrices } from "@/infrastructure/settings/shippingPricesService";

export interface CheckoutPricing {
  shippingPrices: ShippingPrices | null;
  codFeeEur: number;
}

const DEFAULT_PRICING: CheckoutPricing = { shippingPrices: null, codFeeEur: 0 };

/** Client-side fetch of the public, admin-set shipping prices + COD fee (see /api/checkout/pricing). */
export function usePricing(): CheckoutPricing {
  const [pricing, setPricing] = useState<CheckoutPricing>(DEFAULT_PRICING);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout/pricing")
      .then((response) => response.json())
      .then((data: { shippingPrices: ShippingPrices; codFeeEur: number }) => {
        if (!cancelled) setPricing(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
}
