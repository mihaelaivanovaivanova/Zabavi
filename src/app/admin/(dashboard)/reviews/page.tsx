import { Suspense } from "react";
import { connection } from "next/server";
import { reviewRepository } from "@/infrastructure/repositories/reviewRepository";
import { ReviewsTable } from "@/components/admin/ReviewsTable";

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Отзиви</h1>
      <p className="mt-2 text-sm text-ink-700">
        Одобрените отзиви се показват в секция „Какво казват клиентите“ на сайта. Потвърждаването на имейла от клиента
        не публикува отзива сам по себе си — винаги трябва изрично одобрение оттук.
      </p>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <ReviewsSection />
      </Suspense>
    </div>
  );
}

async function ReviewsSection() {
  await connection();
  const reviews = await reviewRepository.findAll();
  return <ReviewsTable initialReviews={reviews} />;
}
