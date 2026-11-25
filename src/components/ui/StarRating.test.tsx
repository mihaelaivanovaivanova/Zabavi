import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StarRating } from "@/components/ui/StarRating";

describe("StarRating", () => {
  it("renders read-only when no onChange is given", () => {
    render(<StarRating value={4} count={12} />);

    expect(screen.getByRole("img", { name: "Рейтинг 4 от 5" })).toBeInTheDocument();
    expect(screen.getByText("12 отзива")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("renders a clickable radiogroup when onChange is given, and reports the clicked star", () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);

    fireEvent.click(stars[2]);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("marks the matching star as checked for the current value", () => {
    render(<StarRating value={3} onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "3 звезди" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "4 звезди" })).toHaveAttribute("aria-checked", "false");
  });
});
