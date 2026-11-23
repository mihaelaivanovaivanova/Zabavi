import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { CookieConsentProvider } from "@/lib/CookieConsentContext";

const STORAGE_KEY = "zabavi-cookie-consent";

beforeEach(() => {
  window.localStorage.clear();
});

describe("CookieConsent", () => {
  it("shows the banner on first visit and hides it after accepting all", async () => {
    render(
      <CookieConsentProvider>
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(screen.getByRole("region", { name: "Настройки на бисквитките" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Приеми всички" }));

    expect(screen.queryByRole("region", { name: "Настройки на бисквитките" })).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored).toMatchObject({ analytics: true, marketing: true, preferences: true });
  });

  it("stores only necessary cookies when that option is chosen", async () => {
    render(
      <CookieConsentProvider>
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(screen.getByRole("region", { name: "Настройки на бисквитките" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Само необходими" }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored).toMatchObject({ analytics: false, marketing: false, preferences: false });
  });

  it("does not show the banner again once a choice was already stored", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ analytics: false, marketing: false, preferences: false, decidedAt: new Date().toISOString() }),
    );

    render(
      <CookieConsentProvider>
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull());
    expect(screen.queryByRole("region", { name: "Настройки на бисквитките" })).not.toBeInTheDocument();
  });

  it("lets the visitor customize categories individually and save them", async () => {
    render(
      <CookieConsentProvider>
        <CookieConsent />
      </CookieConsentProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Персонализирай" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Персонализирай" }));

    fireEvent.click(screen.getByRole("checkbox", { name: /Аналитични/ }));
    fireEvent.click(screen.getByRole("button", { name: "Запази избора" }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored).toMatchObject({ analytics: true, marketing: false, preferences: false });
  });
});
