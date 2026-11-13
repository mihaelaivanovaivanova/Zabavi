"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { CheckBadgeList } from "@/components/ui/CheckBadgeList";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/ui/ProductGallery";
import { StarRating } from "@/components/ui/StarRating";
import { VariantPriceCard } from "@/components/landing/VariantPriceCard";
import { product, testimonials } from "@/config/site";
import { useKits } from "@/lib/useKits";

export function Hero() {
  const [activeVariantId, setActiveVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const activeIndex = Math.max(
    0,
    product.variants.findIndex((variant) => variant.id === activeVariantId),
  );
  const { kits } = useKits();
  const activeKit = kits.find((kit) => kit.variantId === activeVariantId);

  const galleryImages = activeKit
    ? [...(activeKit.coverImage ? [activeKit.coverImage] : []), ...activeKit.gallery].map((image) => ({
        label: image.alt,
        alt: image.alt,
        url: image.url,
      }))
    : [];
  const shownGalleryImages = galleryImages.length > 0 ? galleryImages : product.gallery;

  // The gallery stays pinned in view (plain CSS position: sticky) while the
  // page scrolls past the taller info column beside it, same behavior as
  // https://juun.bg/products/creatine-gummies — not an internal scroll
  // area on the info column, which clips content instead of just letting
  // the page scroll normally. `stickyTop` is measured from the live sticky
  // header's height (not hardcoded) so the gallery sticks flush underneath
  // it rather than guessing a pixel offset.
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    function syncStickyTop() {
      const header = document.querySelector("header");
      setStickyTop(header ? header.getBoundingClientRect().height : 0);
    }

    syncStickyTop();
    window.addEventListener("resize", syncStickyTop);
    return () => window.removeEventListener("resize", syncStickyTop);
  }, []);

  return (
    <section className="bg-lavender-50 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <Container className="grid items-start gap-10 sm:grid-cols-2">
        <div className="sm:sticky" style={{ top: stickyTop }}>
          <ProductGallery images={shownGalleryImages} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <StarRating value={product.rating} count={testimonials.length} starClassName="h-7 w-7" />
          </div>
          <p className="mt-6 max-w-md text-lg text-ink-800">{product.tagline}</p>
          <div className="mt-6">
            <CheckBadgeList items={product.highlights} />
          </div>

          <div
            role="tablist"
            aria-label="Теми на комплекта"
            className="relative mt-6 flex max-w-md rounded-full border border-lavender-200 bg-paper-50 p-1"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-full bg-burgundy-800 transition-transform duration-300 ease-in-out"
              style={{
                width: `calc((100% - 0.5rem) / ${product.variants.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                role="tab"
                aria-selected={variant.id === activeVariantId}
                onClick={() => setActiveVariantId(variant.id)}
                className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  variant.id === activeVariantId ? "text-paper-50" : "text-ink-700 hover:text-ink-900"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-w-md">
            {(() => {
              const activeVariant = product.variants.find((variant) => variant.id === activeVariantId);
              return activeVariant ? (
                <VariantPriceCard
                  variant={activeVariant}
                  priceBgn={activeKit?.priceBgn ?? null}
                  compareAtPriceBgn={activeKit?.compareAtPriceBgn ?? null}
                  active
                  onSelect={() => setActiveVariantId(activeVariant.id)}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              ) : null;
            })()}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <LinkButton href={`/checkout?variant=${activeVariantId}&quantity=${quantity}`} variant="primary">
              Подари си момент
            </LinkButton>
            <LinkButton href="#whats-inside" variant="ghost">
              Виж какво има в кутията
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
