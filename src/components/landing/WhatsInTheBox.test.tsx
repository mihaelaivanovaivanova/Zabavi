import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsInTheBox } from "@/components/landing/WhatsInTheBox";
import { SelectedVariantProvider } from "@/lib/SelectedVariantContext";
import { product } from "@/config/site";

function mockKitsResponse(
  kits: Array<{
    variantId: string;
    boxContentsVideoUrl?: string | null;
    boxContentsVideoThumbnail?: { url: string; alt: string } | null;
  }>,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          kits: kits.map((k) => ({
            variantId: k.variantId,
            priceEur: null,
            compareAtPriceEur: null,
            coverImage: null,
            gallery: [],
            boxContentsVideoUrl: k.boxContentsVideoUrl ?? null,
            boxContentsVideoThumbnail: k.boxContentsVideoThumbnail ?? null,
            updatedAt: new Date(0).toISOString(),
          })),
        }),
        { status: 200 },
      ),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WhatsInTheBox", () => {
  const variantId = product.variants[0].id;

  it("shows a placeholder box when the selected kit has no video", async () => {
    mockKitsResponse([{ variantId }]);
    render(
      <SelectedVariantProvider defaultVariantId={variantId}>
        <WhatsInTheBox />
      </SelectedVariantProvider>,
    );

    await waitFor(() => expect(screen.getByRole("img", { name: /Разложено съдържание/ })).toBeInTheDocument());
    expect(screen.queryByRole("application")).not.toBeInTheDocument();
  });

  it("renders the kit's video with its thumbnail as the poster", async () => {
    mockKitsResponse([
      {
        variantId,
        boxContentsVideoUrl: "/api/uploads/kits/video.mp4",
        boxContentsVideoThumbnail: { url: "/api/uploads/kits/poster.png", alt: "Кадър от видеото" },
      },
    ]);
    const { container } = render(
      <SelectedVariantProvider defaultVariantId={variantId}>
        <WhatsInTheBox />
      </SelectedVariantProvider>,
    );

    const video = await waitFor(() => {
      const element = container.querySelector("video");
      expect(element).toBeInTheDocument();
      return element!;
    });
    expect(video).toHaveAttribute("src", "/api/uploads/kits/video.mp4");
    expect(video).toHaveAttribute("poster", "/api/uploads/kits/poster.png");
  });

  it("renders the video without a poster attribute when no thumbnail is set", async () => {
    mockKitsResponse([{ variantId, boxContentsVideoUrl: "/api/uploads/kits/video.mp4" }]);
    const { container } = render(
      <SelectedVariantProvider defaultVariantId={variantId}>
        <WhatsInTheBox />
      </SelectedVariantProvider>,
    );

    const video = await waitFor(() => {
      const element = container.querySelector("video");
      expect(element).toBeInTheDocument();
      return element!;
    });
    expect(video).not.toHaveAttribute("poster");
  });
});
