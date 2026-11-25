"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { product } from "@/config/site";
import { useReviewsContent } from "@/lib/useReviewsContent";
import { ReviewWizardModal } from "@/components/landing/ReviewWizardModal";

const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 3;
// Matches the `sm:` breakpoint the grid below switches columns at.
const DESKTOP_MEDIA_QUERY = "(min-width: 640px)";

export function Testimonials() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [page, setPage] = useState(0);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { reviews } = useReviewsContent();

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const pageSize = isDesktop ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  // Clamped at render time rather than written back via an effect, so
  // resizing past the current page's range doesn't throw the visitor back
  // to the start of the list — it just settles on the new last page.
  const currentPage = Math.min(page, totalPages - 1);

  const visible = reviews.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <Section tone="lavender">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-ink-900">Какво казват клиентите</h2>
        <div className="mt-4 flex justify-center">
          <StarRating value={product.rating} count={reviews.length} starClassName="h-7 w-7" />
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((review) => (
            <li key={review.id} className="rounded-xl border border-lavender-200 bg-paper-100 p-5">
              {review.rating !== null ? (
                <StarRating value={review.rating} starClassName="h-4 w-4" />
              ) : null}
              <p className={review.rating !== null ? "mt-2 text-ink-800" : "text-ink-800"}>„{review.body}“</p>
              <p className="mt-4 text-sm font-semibold text-ink-900">{review.displayName}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={currentPage === 0}
            aria-label="Предишна страница"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-lavender-300 text-ink-800 disabled:opacity-30"
          >
            ←
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`Страница ${index + 1}`}
                aria-current={currentPage === index}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  currentPage === index ? "bg-burgundy-700" : "bg-lavender-300"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={currentPage === totalPages - 1}
            aria-label="Следваща страница"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-lavender-300 text-ink-800 disabled:opacity-30"
          >
            →
          </button>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <Button type="button" variant="secondary" className="px-14" onClick={() => setIsWizardOpen(true)}>
          Остави отзив
        </Button>
      </div>

      <ReviewWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </Section>
  );
}
