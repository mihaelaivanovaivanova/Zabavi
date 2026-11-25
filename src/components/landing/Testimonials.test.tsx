import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function mockReviewsFetch(reviews: Array<{ id: string; rating: number | null; body: string; displayName: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ reviews: reviews.map((review) => ({ ...review, createdAt: new Date(0).toISOString() })) }),
        { status: 200 },
      ),
    ),
  );
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

  it("renders admin-approved reviews instead of the legacy testimonials once loaded", async () => {
    mockReviewsFetch([{ id: "r1", rating: 4, body: "Нов истински отзив.", displayName: "Нов клиент" }]);
    render(<Testimonials />);

    await waitFor(() => expect(screen.getByText("Нов клиент")).toBeInTheDocument());
    expect(screen.getByText("„Нов истински отзив.“")).toBeInTheDocument();
    expect(screen.queryByText(testimonials[0].author)).not.toBeInTheDocument();
  });

  it("shows 'Анонимен' for a review submitted anonymously", async () => {
    mockReviewsFetch([{ id: "r1", rating: 5, body: "Анонимен отзив.", displayName: "Анонимен" }]);
    render(<Testimonials />);

    await waitFor(() => expect(screen.getByText("Анонимен")).toBeInTheDocument());
  });

  it("opens the review wizard when 'Остави отзив' is clicked", () => {
    render(<Testimonials />);

    fireEvent.click(screen.getByRole("button", { name: "Остави отзив" }));

    expect(screen.getByText("Как бихте оценили този продукт?")).toBeInTheDocument();
  });
});
