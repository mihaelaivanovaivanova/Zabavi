"use client";

import { LinkButton } from "@/components/ui/Button";
import { ProductGallery } from "@/components/ui/ProductGallery";
import { Section } from "@/components/ui/Section";
import { StarRating } from "@/components/ui/StarRating";
import { formatBgn } from "@/lib/format";
import { product, testimonials } from "@/config/site";
import { useKits } from "@/lib/useKits";

export function ProductOffer() {
  const { kits } = useKits();
  const confirmedPrices = kits.map((kit) => kit.priceBgn).filter((price): price is number => price !== null);
  const lowestPrice = confirmedPrices.length > 0 ? Math.min(...confirmedPrices) : null;

  return (
    <Section id="product" tone="lavender">
      <div className="grid gap-10 rounded-3xl bg-paper-50 p-8 sm:grid-cols-2 sm:p-12">
        <ProductGallery images={product.gallery} />
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-ink-900">{product.name}</h2>
          <div className="mt-2">
            <StarRating value={product.rating} count={testimonials.length} starClassName="h-7 w-7" />
          </div>
          <p className="mt-3 text-ink-700">{product.description}</p>
          <p className="mt-6 text-2xl font-semibold text-burgundy-700">
            {lowestPrice !== null ? `от ${formatBgn(lowestPrice)}` : formatBgn(null)}
          </p>
          <LinkButton href="/checkout" variant="primary" className="mt-6 self-start">
            Поръчай сега
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
