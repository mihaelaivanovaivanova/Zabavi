"use client";

import { Section } from "@/components/ui/Section";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { product } from "@/config/site";
import { useKits } from "@/lib/useKits";
import { useSelectedVariant } from "@/lib/SelectedVariantContext";

export function WhatsInTheBox() {
  const { selectedVariantId } = useSelectedVariant();
  const { kits } = useKits();
  const kit = kits.find((kit) => kit.variantId === selectedVariantId);
  const videoUrl = kit?.boxContentsVideoUrl;
  const thumbnailUrl = kit?.boxContentsVideoThumbnail?.url;
  const boxContents = kit?.boxContents ?? product.boxContents;
  const boxContentsExtra = kit?.boxContentsExtra ?? [];

  return (
    <Section id="whats-inside" tone="lavender">
      <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
        {/* On mobile the video plays after the box-contents list (order-2);
            on desktop it keeps its original left-column position (sm:order-1). */}
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={thumbnailUrl}
            controls
            playsInline
            className="order-2 aspect-[9/16] w-full max-w-sm mx-auto rounded-2xl bg-ink-900/5 object-cover sm:order-1"
          />
        ) : (
          <PlaceholderImage
            label="Съдържание на кутията"
            alt="Разложено съдържание на акварелния creative kit"
            aspect="reel"
            className="order-2 w-full max-w-sm mx-auto sm:order-1"
          />
        )}
        <div className="order-1 sm:order-2">
          <h2 className="text-3xl font-semibold text-ink-900">Какво има в кутията</h2>
          <ul className="mt-6 space-y-3">
            {boxContents.map((item) => (
              <li key={item} className="flex gap-3 text-ink-800">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {boxContentsExtra.length > 0 ? (
            <div className="relative mt-6 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative torn-paper background, not a content photo */}
              <img
                src="/images/bonus-banner.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-fill"
              />
              <div className="relative">
                <p className="text-sm font-semibold text-ink-900">Получавате още:</p>
                <ul className="mt-2 space-y-2">
                  {boxContentsExtra.map((item) => (
                    <li key={item} className="flex gap-3 text-ink-800">
                      <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
