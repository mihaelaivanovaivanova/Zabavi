import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBadges } from "@/components/landing/TrustBadges";

describe("TrustBadges", () => {
  it("renders all five trust claims with the exact approved copy", () => {
    render(<TrustBadges />);

    expect(screen.getByText("Доставка 1-2 работни дни")).toBeInTheDocument();
    expect(screen.getByText("Сигурно плащане с карта")).toBeInTheDocument();
    expect(screen.getByText("Наложен платеж")).toBeInTheDocument();
    expect(screen.getByText("100% гаранция за качество")).toBeInTheDocument();
    expect(screen.getByText("30 дни право на връщане")).toBeInTheDocument();
  });

  it("renders one icon per badge", () => {
    const { container } = render(<TrustBadges />);
    expect(container.querySelectorAll("img")).toHaveLength(5);
  });
});
