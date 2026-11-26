import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxNowBadge } from "@/components/landing/BoxNowBadge";

function mockFetch(content: { bannerEnabled: boolean; badgeEnabled: boolean; bannerMessage: string }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ content }), { status: 200 })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BoxNowBadge", () => {
  it("renders the badge, linking to the shipping page, when enabled", async () => {
    mockFetch({ bannerEnabled: true, badgeEnabled: true, bannerMessage: "x" });
    render(<BoxNowBadge />);

    await waitFor(() => expect(screen.getByRole("link")).toHaveAttribute("href", "/shipping"));
  });

  it("renders nothing once the admin has disabled the badge", async () => {
    mockFetch({ bannerEnabled: true, badgeEnabled: false, bannerMessage: "x" });
    const { container } = render(<BoxNowBadge />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
