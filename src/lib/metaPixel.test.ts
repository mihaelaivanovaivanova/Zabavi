import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  delete window.fbq;
  delete window._fbq;
  document.head.querySelectorAll("script").forEach((script) => script.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("loadMetaPixel", () => {
  it("does nothing when no pixel ID is configured", async () => {
    const { loadMetaPixel } = await import("@/lib/metaPixel");
    loadMetaPixel();

    expect(window.fbq).toBeUndefined();
    expect(document.head.querySelector('script[src*="fbevents.js"]')).toBeNull();
  });

  it("injects the fbevents script and initializes fbq once a pixel ID is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");
    const { loadMetaPixel } = await import("@/lib/metaPixel");

    loadMetaPixel();

    expect(window.fbq).toBeTypeOf("function");
    expect(document.head.querySelector('script[src*="fbevents.js"]')).not.toBeNull();
    expect(window.fbq?.queue).toEqual([
      ["init", "1234567890"],
      ["track", "PageView"],
    ]);
  });

  it("is idempotent — calling it again does not inject a second script", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");
    const { loadMetaPixel } = await import("@/lib/metaPixel");

    loadMetaPixel();
    loadMetaPixel();

    expect(document.head.querySelectorAll('script[src*="fbevents.js"]')).toHaveLength(1);
  });
});
