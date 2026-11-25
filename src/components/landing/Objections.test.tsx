import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Objections } from "@/components/landing/Objections";
import { objections } from "@/config/site";

function mockFetch(items: Array<{ question: string; answer: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: { items } }), { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Objections", () => {
  it("renders the admin-edited replies instead of the config defaults", async () => {
    mockFetch([{ question: "…админ възражение?", answer: "Админ отговор." }]);
    render(<Objections />);

    await waitFor(() => expect(screen.getByText("…админ възражение?")).toBeInTheDocument());
    expect(screen.getByText("Админ отговор.")).toBeInTheDocument();
    expect(screen.queryByText(objections[0].question)).not.toBeInTheDocument();
  });

  it("falls back to the config default replies when nothing is saved yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<Objections />);

    await waitFor(() => expect(screen.getByText(objections[0].question)).toBeInTheDocument());
  });
});
