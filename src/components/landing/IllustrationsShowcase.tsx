"use client";

import { Section } from "@/components/ui/Section";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { product } from "@/config/site";
import { useKits } from "@/lib/useKits";
import { useSelectedVariant } from "@/lib/SelectedVariantContext";
import { useIllustrationsSectionContent } from "@/lib/useIllustrationsSectionContent";

export function IllustrationsShowcase() {
  const { selectedVariantId } = useSelectedVariant();
  const { kits } = useKits();
  const { content } = useIllustrationsSectionContent();
  const activeKit = kits.find((kit) => kit.variantId === selectedVariantId);

  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">{content.heading}</h2>
      {content.intro ? (
        <p className="mx-auto mt-4 max-w-xl text-center text-ink-700">{content.intro}</p>
      ) : null}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {product.illustrations.map((illustration, index) => {
          const image = activeKit?.illustrationImages?.[index];
          const item = activeKit?.illustrationContent?.[index] ?? illustration;
          return (
            <div key={illustration.title}>
              <h3 className="mb-3 text-center text-lg font-medium text-ink-900">{item.title}</h3>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
                <img
                  src={image.url}
                  alt={image.alt}
                  className="aspect-[3/4] w-full rounded-2xl object-cover"
                  style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
                />
              ) : (
                <PlaceholderImage label={illustration.image.label} alt={illustration.image.alt} aspect="portrait" />
              )}
              {item.description ? (
                <p className="mt-2 text-center text-sm text-ink-700">{item.description}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
