"use client";

import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Section } from "@/components/ui/Section";
import { StarRating } from "@/components/ui/StarRating";
import { product, testimonials } from "@/config/site";

// The data model has no per-review rating or date (see Testimonial in
// src/domain/product/types.ts) — only one confirmed aggregate rating for
// the whole product, so there's no real "most recent" or "highest rated"
// order to sort by. This just takes the first 5 real testimonials as given.
const featuredReviews = testimonials.slice(0, 5);

const blobBackgrounds = [
  "/images/reviews/blob-blue.webp",
  "/images/reviews/blob-burgundy.webp",
  "/images/reviews/blob-lavender.webp",
  "/images/reviews/blob-orange.webp",
  "/images/reviews/blob-violet.webp",
];

export function FeaturedReviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  if (featuredReviews.length === 0) return null;

  function scrollToStart() {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    setAtEnd(false);
  }

  function scrollToEnd() {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: "smooth" });
    setAtEnd(true);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setAtEnd(maxScroll <= 1 || track.scrollLeft >= maxScroll - 1);
  }

  return (
    <Section tone="lavender">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-ink-900">Последни отзиви</h2>
        <div className="mt-4 flex justify-center">
          <StarRating value={product.rating} count={testimonials.length} starClassName="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-10">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {featuredReviews.map((review, index) => (
            <div
              key={review.author}
              className="relative aspect-square w-[80%] shrink-0 snap-center transition-transform duration-200 hover:z-10 hover:scale-105 sm:w-[45%] lg:w-[calc((100%-3rem)/4)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor shape, not a content photo */}
              <img
                src={blobBackgrounds[index % blobBackgrounds.length]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain"
              />
              <div className="relative flex h-full flex-col items-center justify-center px-[16%] py-[14%] text-center">
                <StarRating value={product.rating} starClassName="h-4 w-4" />
                <p className="mt-2 text-xs text-ink-800 sm:text-sm">„{review.quote}“</p>
                <p className="mt-2 text-xs font-semibold text-ink-900 sm:text-sm">{review.author}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Предишни отзиви"
          onClick={scrollToStart}
          disabled={!atEnd}
          className="absolute -left-4 top-1/2 hidden -translate-y-1/2 transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ArrowIcon direction="left" />
        </button>
        <button
          type="button"
          aria-label="Следващи отзиви"
          onClick={scrollToEnd}
          disabled={atEnd}
          className="absolute -right-4 top-1/2 hidden -translate-y-1/2 transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ArrowIcon direction="right" />
        </button>

        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            aria-label="Начало"
            onClick={scrollToStart}
            className={`h-2 w-2 rounded-full transition-colors ${!atEnd ? "bg-burgundy-700" : "bg-lavender-300"}`}
          />
          <button
            type="button"
            aria-label="Още отзиви"
            onClick={scrollToEnd}
            className={`h-2 w-2 rounded-full transition-colors ${atEnd ? "bg-burgundy-700" : "bg-lavender-300"}`}
          />
        </div>
      </div>
    </Section>
  );
}
