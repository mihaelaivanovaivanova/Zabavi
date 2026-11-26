import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TopAnnouncementBar } from "@/components/landing/TopAnnouncementBar";

function mockFetch(content: { bannerEnabled: boolean; badgeEnabled: boolean; bannerMessage: string }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ content }), { status: 200 })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TopAnnouncementBar", () => {
  it("shows the admin-edited message when the banner is enabled", async () => {
    mockFetch({ bannerEnabled: true, badgeEnabled: true, bannerMessage: "Безплатна доставка с BOX NOW до 1 март!" });
    render(<TopAnnouncementBar />);

    await waitFor(() =>
      expect(screen.getByText("Безплатна доставка с BOX NOW до 1 март!")).toBeInTheDocument(),
    );
  });

  it("renders nothing once the admin has disabled the banner", async () => {
    mockFetch({ bannerEnabled: false, badgeEnabled: true, bannerMessage: "Безплатна доставка с BOX NOW" });
    const { container } = render(<TopAnnouncementBar />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
