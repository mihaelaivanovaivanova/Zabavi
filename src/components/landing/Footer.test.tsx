import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/landing/Footer";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { CookieConsentProvider } from "@/lib/CookieConsentContext";

function renderFooter() {
  return render(
    <CookieConsentProvider>
      <Footer />
      <CookieConsent />
    </CookieConsentProvider>,
  );
}

describe("Footer", () => {
  it("links to all four legal pages", () => {
    renderFooter();

    expect(screen.getByRole("link", { name: "Общи условия" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Политика за поверителност и бисквитки" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Право на отказ, връщане и рекламации" })).toHaveAttribute(
      "href",
      "/returns",
    );
    expect(screen.getByRole("link", { name: "Политика за доставка" })).toHaveAttribute("href", "/shipping");
  });

  it("shows the real company name, EIK and contact email", () => {
    renderFooter();

    expect(screen.getByText("„ФИЛЧЕВ УЕБ“ ЕООД")).toBeInTheDocument();
    expect(screen.getByText("ЕИК: 208699419")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contact@zabavi.bg" })).toHaveAttribute(
      "href",
      "mailto:contact@zabavi.bg",
    );
  });

  it("opens the cookie settings dialog from the footer button", () => {
    renderFooter();

    fireEvent.click(screen.getByRole("button", { name: "Настройки на бисквитките" }));

    expect(screen.getByRole("dialog", { name: "Настройки на бисквитките" })).toBeInTheDocument();
  });
});
