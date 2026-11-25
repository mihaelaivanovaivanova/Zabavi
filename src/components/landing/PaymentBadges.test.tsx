import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentBadges } from "@/components/landing/PaymentBadges";

describe("PaymentBadges", () => {
  it("renders all five accepted payment method marks", () => {
    render(<PaymentBadges />);

    expect(screen.getByAltText("Apple Pay")).toBeInTheDocument();
    expect(screen.getByAltText("Google Pay")).toBeInTheDocument();
    expect(screen.getByAltText("Visa")).toBeInTheDocument();
    expect(screen.getByAltText("Mastercard")).toBeInTheDocument();
    expect(screen.getByAltText("American Express")).toBeInTheDocument();
  });
});
