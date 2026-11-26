import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { product } from "@/config/site";

function mockFetch(content: { heading: string; steps: { title: string; description: string }[] }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ content }), { status: 200 })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HowItWorks", () => {
  it("renders the admin-edited heading and steps instead of the config defaults", async () => {
    mockFetch({ heading: "Нов процес", steps: [{ title: "Админ стъпка", description: "Админ описание." }] });
    render(<HowItWorks />);

    await waitFor(() => expect(screen.getByText("Нов процес")).toBeInTheDocument());
    expect(screen.getByText("Админ стъпка")).toBeInTheDocument();
    expect(screen.getByText("Админ описание.")).toBeInTheDocument();
    expect(screen.queryByText(product.howItWorksSection.steps[0].title)).not.toBeInTheDocument();
  });

  it("falls back to the config default steps when nothing is saved yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<HowItWorks />);

    await waitFor(() =>
      expect(screen.getByText(product.howItWorksSection.steps[0].title)).toBeInTheDocument(),
    );
  });

  it("numbers the steps in order, rendered one after another", async () => {
    mockFetch(product.howItWorksSection);
    render(<HowItWorks />);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(product.howItWorksSection.steps.length));
    const items = screen.getAllByRole("listitem");
    product.howItWorksSection.steps.forEach((step, index) => {
      expect(items[index]).toHaveTextContent(step.title);
    });
  });
});
