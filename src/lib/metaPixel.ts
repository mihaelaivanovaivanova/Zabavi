/**
 * Meta Pixel loader — same approach as smisul.bg's `analytics.ts`: a
 * build-time env var (`NEXT_PUBLIC_META_PIXEL_ID`), no admin-panel setting
 * (smisul.bg doesn't have one either, it's purely an env var there too), and
 * the script never loads until the visitor has granted "marketing" cookie
 * consent — see `CookieConsentContext`. Unlike smisul.bg, there is no real
 * pixel ID to fall back to yet, so an unset env var means the pixel simply
 * never loads (a safe no-op), rather than inventing one.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      push?: unknown;
      loaded?: boolean;
      version?: string;
    };
    _fbq?: unknown;
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

let loaded = false;

export function loadMetaPixel(): void {
  if (loaded || !META_PIXEL_ID || typeof window === "undefined") return;
  loaded = true;

  const fbq: NonNullable<Window["fbq"]> = (...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      (fbq.queue as unknown[]).push(args);
    }
  };
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

/** Exposed for tests only — production code never needs to "un-load" a pixel mid-session. */
export function __resetMetaPixelForTests(): void {
  loaded = false;
}
