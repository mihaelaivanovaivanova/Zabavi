"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/lib/CookieConsentContext";
import { loadMetaPixel } from "@/lib/metaPixel";

/** Renders nothing — just loads the Meta Pixel once "marketing" consent is granted. */
export function MetaPixelLoader() {
  const { preferences } = useCookieConsent();

  useEffect(() => {
    if (preferences.marketing) {
      loadMetaPixel();
    }
  }, [preferences.marketing]);

  return null;
}
