import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IllustrationsShowcase } from "@/components/landing/IllustrationsShowcase";
import { SelectedVariantProvider } from "@/lib/SelectedVariantContext";
import { product } from "@/config/site";

function mockFetch(illustrationsContent: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/content/illustrations-section") {
        return Promise.resolve(new Response(JSON.stringify({ content: illustrationsContent }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ kits: [] }), { status: 200 }));
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderShowcase() {
  return render(
    <SelectedVariantProvider defaultVariantId="christmas-magic">
      <IllustrationsShowcase />
    </SelectedVariantProvider>,
  );
}

describe("IllustrationsShowcase", () => {
  beforeEach(() => {
    mockFetch({
      heading: "Избери си настроение",
      intro: "Четири авторски скици, готови за боя.",
      items: product.illustrations.map((illustration) => ({
        title: illustration.title,
        description: illustration.description,
      })),
    });
  });

  it("renders the admin-edited section heading and intro instead of the config defaults", async () => {
    renderShowcase();

    await waitFor(() => expect(screen.getByText("Избери си настроение")).toBeInTheDocument());
    expect(screen.getByText("Четири авторски скици, готови за боя.")).toBeInTheDocument();
  });

  it("renders the admin-edited title and description for each illustration", async () => {
    mockFetch({
      heading: product.illustrationsSection.heading,
      intro: product.illustrationsSection.intro,
      items: product.illustrations.map((illustration, index) => ({
        title: index === 0 ? "Зимна приказка" : illustration.title,
        description: index === 0 ? "Контурна скица с елени и снежинки." : illustration.description,
      })),
    });
    renderShowcase();

    await waitFor(() => expect(screen.getByText("Зимна приказка")).toBeInTheDocument());
    expect(screen.getByText("Контурна скица с елени и снежинки.")).toBeInTheDocument();
  });

  it("hides the description paragraph for an illustration whose description was cleared", async () => {
    mockFetch({
      heading: product.illustrationsSection.heading,
      intro: product.illustrationsSection.intro,
      items: product.illustrations.map((illustration, index) => ({
        title: illustration.title,
        description: index === 0 ? "" : illustration.description,
      })),
    });
    renderShowcase();

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 3, name: product.illustrations[0].title })).toBeInTheDocument(),
    );
    // All four illustrations share the same generic description text in the config, so with
    // only the first one cleared, three (not four) description paragraphs should remain.
    expect(screen.getAllByText(product.illustrations[1].description)).toHaveLength(3);
  });

  it("hides the section intro paragraph when it was cleared", async () => {
    mockFetch({
      heading: product.illustrationsSection.heading,
      intro: "",
      items: product.illustrations.map((illustration) => ({
        title: illustration.title,
        description: illustration.description,
      })),
    });
    renderShowcase();

    await waitFor(() => expect(screen.getByText(product.illustrationsSection.heading)).toBeInTheDocument());
    expect(screen.queryByText(product.illustrationsSection.intro)).not.toBeInTheDocument();
  });
});
