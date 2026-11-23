import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StickyBuyBar } from "@/components/landing/StickyBuyBar";

const baseProps = {
  imageUrl: undefined,
  imageAlt: "Акварелен комплект",
  name: "Акварелни комплекти „ЗАБАВЍ“",
  priceEur: 44.99,
  rating: 5,
  reviewCount: 7,
  justAdded: false,
};

describe("StickyBuyBar", () => {
  it("is hidden from assistive tech and non-tabbable while not visible", () => {
    render(<StickyBuyBar {...baseProps} visible={false} onAddToCart={() => {}} />);

    expect(screen.getByRole("button", { hidden: true, name: "Добави" })).toHaveAttribute("tabindex", "-1");
  });

  it("is reachable once visible", () => {
    render(<StickyBuyBar {...baseProps} visible onAddToCart={() => {}} />);

    expect(screen.getByRole("button", { name: "Добави" })).toHaveAttribute("tabindex", "0");
  });

  it("calls onAddToCart when its button is clicked", () => {
    const onAddToCart = vi.fn();
    render(<StickyBuyBar {...baseProps} visible onAddToCart={onAddToCart} />);

    fireEvent.click(screen.getByRole("button", { name: "Добави" }));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it("shows the confirmation label once justAdded is true", () => {
    render(<StickyBuyBar {...baseProps} visible justAdded onAddToCart={() => {}} />);

    expect(screen.getByRole("button", { name: "Добавено ✓" })).toBeInTheDocument();
  });

  it("never fabricates a price — shows the TBD copy when priceEur is null", () => {
    render(<StickyBuyBar {...baseProps} priceEur={null} visible onAddToCart={() => {}} />);

    expect(screen.getByText("предстои да се зададе")).toBeInTheDocument();
  });
});
