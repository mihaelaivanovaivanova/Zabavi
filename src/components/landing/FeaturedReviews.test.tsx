import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturedReviews } from "@/components/landing/FeaturedReviews";

beforeEach(() => {
  // jsdom doesn't implement Element.scrollTo (only window.scrollTo) — the
  // carousel's swipe-to-index relies on it, works fine in a real browser.
  Element.prototype.scrollTo = vi.fn();
});

describe("FeaturedReviews", () => {
  it("renders exactly the first five real testimonials, not the full list", () => {
    render(<FeaturedReviews />);

    expect(screen.getByText(/Много ми хареса!/)).toBeInTheDocument();
    expect(screen.getByText(/май доста се хареса/)).toBeInTheDocument();
    expect(screen.getByText(/Видеата към всяка картинка/)).toBeInTheDocument();
    expect(screen.getByText(/релаксирала/)).toBeInTheDocument();
    expect(screen.getByText(/Гаджето много му се зарадва/)).toBeInTheDocument();

    // "Все се канех да започна пак да рисувам" (Михаела Димитрова) is the
    // 6th real testimonial — it exists but isn't one of the first five.
    expect(screen.queryByText(/канех да започна/)).not.toBeInTheDocument();
  });

  it("never fabricates a per-review rating — every card shows the one confirmed aggregate rating", () => {
    render(<FeaturedReviews />);

    const ratingImages = screen.getAllByRole("img", { name: /Рейтинг \d от 5/ });
    // One for the heading's aggregate rating, one per featured card.
    expect(ratingImages).toHaveLength(6);
    ratingImages.forEach((img) => expect(img).toHaveAccessibleName("Рейтинг 5 от 5"));
  });

  it("shows exactly two page dots — a simple start/end indicator, not one per review", () => {
    render(<FeaturedReviews />);

    expect(screen.getByRole("button", { name: "Начало" })).toHaveClass("bg-burgundy-700");
    expect(screen.getByRole("button", { name: "Още отзиви" })).toHaveClass("bg-lavender-300");
  });

  it("switches the active dot once scrolled to the end", () => {
    render(<FeaturedReviews />);

    fireEvent.click(screen.getByRole("button", { name: "Следващи отзиви" }));

    expect(screen.getByRole("button", { name: "Начало" })).toHaveClass("bg-lavender-300");
    expect(screen.getByRole("button", { name: "Още отзиви" })).toHaveClass("bg-burgundy-700");
  });

  it("disables the forward arrow at the end and the back arrow at the start", () => {
    render(<FeaturedReviews />);

    expect(screen.getByRole("button", { name: "Предишни отзиви" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Следващи отзиви" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Следващи отзиви" }));

    expect(screen.getByRole("button", { name: "Предишни отзиви" })).not.toBeDisabled();
  });
});
