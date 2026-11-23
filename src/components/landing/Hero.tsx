"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckBadgeList } from "@/components/ui/CheckBadgeList";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/ui/ProductGallery";
import { StarRating } from "@/components/ui/StarRating";
import { PaymentBadges } from "@/components/landing/PaymentBadges";
import { StickyBuyBar } from "@/components/landing/StickyBuyBar";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { VariantPriceCard } from "@/components/landing/VariantPriceCard";
import { product, testimonials } from "@/config/site";
import { resolveVariant } from "@/domain/kit/types";
import { useCart } from "@/lib/CartContext";
import { useKits } from "@/lib/useKits";
import { useSelectedVariant } from "@/lib/SelectedVariantContext";

export function Hero() {
  const { selectedVariantId: activeVariantId, setSelectedVariantId: setActiveVariantId } = useSelectedVariant();
  const [quantity, setQuantity] = useState(1);
  const activeIndex = Math.max(
    0,
    product.variants.findIndex((variant) => variant.id === activeVariantId),
  );
  const { kits } = useKits();
  const activeKit = kits.find((kit) => kit.variantId === activeVariantId);
  const resolvedVariants = product.variants.map((variant) =>
    resolveVariant(
      variant,
      kits.find((kit) => kit.variantId === variant.id),
    ),
  );

  const galleryImages = activeKit
    ? [...(activeKit.coverImage ? [activeKit.coverImage] : []), ...activeKit.gallery].map((image) => ({
        label: image.alt,
        alt: image.alt,
        url: image.url,
        focalX: image.focalX,
        focalY: image.focalY,
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

  // The sticky buy bar mirrors this CTA everywhere else on the page: shown
  // once this one scrolls out of view, hidden again once it's back in view.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const target = ctaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart() {
    addToCart(activeVariantId, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <section className="bg-lavender-50 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <Container className="grid grid-cols-1 items-start gap-10 sm:grid-cols-2">
        <div className="min-w-0 sm:sticky" style={{ top: stickyTop }}>
          <ProductGallery images={shownGalleryImages} />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <StarRating value={product.rating} count={testimonials.length} starClassName="h-7 w-7" />
          </div>
          <p className="mt-6 text-lg text-ink-800">{product.tagline}</p>
          <div className="mt-6">
            <CheckBadgeList items={product.highlights} />
          </div>

          <div
            role="tablist"
            aria-label="Теми на комплекта"
            className="relative mt-6 flex rounded-full border border-lavender-200 bg-paper-50 p-1"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-full bg-burgundy-800 transition-transform duration-300 ease-in-out"
              style={{
                width: `calc((100% - 0.5rem) / ${product.variants.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {resolvedVariants.map((variant) => (
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
                {variant.badge ? (
                  <span className="absolute -top-3 right-1 rounded-full bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-paper-50 shadow">
                    {variant.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {(() => {
              const activeVariant = resolvedVariants.find((variant) => variant.id === activeVariantId);
              return activeVariant ? (
                <VariantPriceCard
                  variant={activeVariant}
                  priceEur={activeKit?.priceEur ?? null}
                  compareAtPriceEur={activeKit?.compareAtPriceEur ?? null}
                  active
                  onSelect={() => setActiveVariantId(activeVariant.id)}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              ) : null;
            })()}
          </div>

          <div ref={ctaRef} className="mt-6">
            <Button type="button" variant="primary" className="w-full" onClick={handleAddToCart}>
              {justAdded ? "Добавено ✓" : "Добави в количката"}
            </Button>
          </div>

          <div className="mt-6">
            <TrustBadges />
          </div>

          <div className="mt-5">
            <PaymentBadges />
          </div>
        </div>
      </Container>

      <StickyBuyBar
        visible={showStickyBar}
        imageUrl={shownGalleryImages[0]?.url}
        imageAlt={shownGalleryImages[0]?.alt ?? product.name}
        imageFocalX={shownGalleryImages[0]?.focalX}
        imageFocalY={shownGalleryImages[0]?.focalY}
        name={product.name}
        priceEur={activeKit?.priceEur ?? null}
        rating={product.rating}
        reviewCount={testimonials.length}
        justAdded={justAdded}
        onAddToCart={handleAddToCart}
      />
    </section>
  );
}
