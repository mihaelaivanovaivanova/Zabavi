"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/config/site";
import type { PublicReview } from "@/domain/review/types";

function fallbackReviews(): PublicReview[] {
  return testimonials.map((testimonial, index) => ({
    id: `legacy-${index}`,
    rating: null,
    body: testimonial.quote,
    displayName: testimonial.author,
    createdAt: new Date(0).toISOString(),
  }));
}

/** Client-side fetch of admin-approved reviews (see /api/content/reviews), falling back to the static config testimonials while loading or on error. */
export function useReviewsContent(): { reviews: PublicReview[]; isLoading: boolean } {
  const [reviews, setReviews] = useState<PublicReview[]>(fallbackReviews());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/reviews")
      .then((response) => response.json())
      .then((data: { reviews?: PublicReview[] }) => {
        if (!cancelled && data.reviews) setReviews(data.reviews);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews, isLoading };
}
