import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MetaPixelLoader } from "@/components/legal/MetaPixelLoader";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { CookieConsentProvider } from "@/lib/CookieConsentContext";

vi.mock("@/lib/metaPixel", () => ({ loadMetaPixel: vi.fn() }));

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("MetaPixelLoader", () => {
  it("does not load the pixel before the visitor accepts marketing cookies", async () => {
    const { loadMetaPixel } = await import("@/lib/metaPixel");

    render(
      <CookieConsentProvider>
        <MetaPixelLoader />
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Само необходими" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Само необходими" }));

    expect(loadMetaPixel).not.toHaveBeenCalled();
  });

  it("loads the pixel once the visitor accepts all cookies", async () => {
    const { loadMetaPixel } = await import("@/lib/metaPixel");

    render(
      <CookieConsentProvider>
        <MetaPixelLoader />
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Приеми всички" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Приеми всички" }));

    expect(loadMetaPixel).toHaveBeenCalled();
  });
});
