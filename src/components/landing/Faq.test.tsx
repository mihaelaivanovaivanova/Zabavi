import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Faq } from "@/components/landing/Faq";
import { faq } from "@/config/site";

function mockFetch(items: Array<{ question: string; answer: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: { items } }), { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Faq", () => {
  it("renders the admin-edited questions and answers instead of the config defaults", async () => {
    mockFetch([{ question: "Админ въпрос?", answer: "Админ отговор." }]);
    render(<Faq />);

    await waitFor(() => expect(screen.getByText("Админ въпрос?")).toBeInTheDocument());
    expect(screen.getByText("Админ отговор.")).toBeInTheDocument();
    expect(screen.queryByText(faq[0].question)).not.toBeInTheDocument();
  });

  it("falls back to the config default questions when nothing is saved yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<Faq />);

    await waitFor(() => expect(screen.getByText(faq[0].question)).toBeInTheDocument());
  });
});
