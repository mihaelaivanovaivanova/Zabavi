"use client";

import { useRef, useState } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import type { PlaceholderImage as PlaceholderImageData } from "@/domain/product/types";

interface ProductGalleryProps {
  images: PlaceholderImageData[];
}

function GalleryImage({ image, aspect }: { image: PlaceholderImageData; aspect: "square" }) {
  if (image.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
      <img src={image.url} alt={image.alt} className="aspect-square w-full rounded-2xl object-cover" />
    );
  }
  return <PlaceholderImage label={image.label} alt={image.alt} aspect={aspect} />;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d={direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
    </svg>
  );
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollToIndex(nextIndex: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(images.length - 1, nextIndex));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  if (images.length <= 1) {
    const image = images[0];
    return image ? <GalleryImage image={image} aspect="square" /> : <PlaceholderImage label="" alt="" aspect="square" />;
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <GalleryImage image={image} aspect="square" />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Предишна снимка"
        onClick={() => scrollToIndex(index - 1)}
        disabled={index === 0}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-paper-50/90 p-2 text-ink-900 shadow transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        aria-label="Следваща снимка"
        onClick={() => scrollToIndex(index + 1)}
        disabled={index === images.length - 1}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-paper-50/90 p-2 text-ink-900 shadow transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ArrowIcon direction="right" />
      </button>

      <div className="mt-3 flex justify-center gap-2 sm:hidden">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Снимка ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-burgundy-700" : "bg-lavender-300"}`}
          />
        ))}
      </div>

      <div className="mt-3 hidden gap-2 sm:flex">
        {images.map((image, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Снимка ${i + 1}`}
            aria-pressed={i === index}
            onClick={() => scrollToIndex(i)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
              i === index ? "border-burgundy-700" : "border-transparent hover:border-lavender-300"
            }`}
          >
            {image.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full border border-dashed border-lavender-300 bg-lavender-50" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
