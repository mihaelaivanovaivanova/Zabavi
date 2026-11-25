import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Testimonials } from "@/components/landing/Testimonials";
import { testimonials } from "@/config/site";

/** Lets a test flip `matches` after mount and fire the "change" listener the component registered, like a real viewport resize would. */
function stubMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let listener: (() => void) | null = null;
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_event: string, callback: () => void) => {
        listener = callback;
      },
      removeEventListener: () => {
        listener = null;
      },
    })),
  );
  return {
    change(next: boolean) {
      matches = next;
      listener?.();
    },
  };
}

beforeEach(() => {
  // Default to desktop; individual tests override when they need mobile.
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Testimonials", () => {
  it("shows at most 6 testimonials per page on desktop", () => {
    render(<Testimonials />);

    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText(testimonials[0].author)).toBeInTheDocument();
    expect(screen.queryByText(testimonials[6].author)).not.toBeInTheDocument();
  });

  it("shows at most 3 testimonials per page on mobile", () => {
    stubMatchMedia(false);
    render(<Testimonials />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("navigates to the next page and shows the remaining testimonial", () => {
    render(<Testimonials />);

    fireEvent.click(screen.getByLabelText("Следваща страница"));

    expect(screen.getByText(testimonials[6].author)).toBeInTheDocument();
    expect(screen.queryByText(testimonials[0].author)).not.toBeInTheDocument();
  });

  it("jumps to a page via its dot indicator", () => {
    render(<Testimonials />);

    fireEvent.click(screen.getByLabelText("Страница 2"));

    expect(screen.getByText(testimonials[6].author)).toBeInTheDocument();
  });

  it("clamps to the last valid page when the layout switches to a smaller page size", () => {
    const mediaQuery = stubMatchMedia(true);
    render(<Testimonials />);

    fireEvent.click(screen.getByLabelText("Страница 2"));
    expect(screen.getByText(testimonials[6].author)).toBeInTheDocument();

    act(() => {
      mediaQuery.change(false);
    });

    // 7 items at 3/page is 3 pages; page index 1 (the desktop page 2) is
    // still valid on mobile, so it should stay rather than reset to page 1.
    expect(screen.getByText(testimonials[3].author)).toBeInTheDocument();
    expect(screen.queryByText(testimonials[6].author)).not.toBeInTheDocument();
  });
});
