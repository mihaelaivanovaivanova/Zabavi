import { Suspense } from "react";
import { connection } from "next/server";
import { Section } from "@/components/ui/Section";
import { confirmReview } from "@/infrastructure/reviews/reviewService";
import { verifyReviewConfirmationToken } from "@/lib/reviewConfirmationToken";

export default function ReviewConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Section tone="lavender">
      <div className="mx-auto max-w-md text-center">
        <Suspense fallback={<p className="text-ink-700">Проверяваме линка…</p>}>
          <ConfirmResult params={params} />
        </Suspense>
      </div>
    </Section>
  );
}

async function ConfirmResult({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;

  const reviewId = await verifyReviewConfirmationToken(token);
  const confirmed = reviewId ? await confirmReview(reviewId) : false;

  if (confirmed) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-ink-900">Отзивът е потвърден!</h1>
        <p className="mt-3 text-ink-700">
          Благодарим ти — отзивът ти очаква преглед и ще се появи на сайта, след като го одобрим.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-ink-900">Линкът не е валиден</h1>
      <p className="mt-3 text-ink-700">
        Може да е изтекъл или вече да е използван. Ако все още искаш да потвърдиш отзива си, свържи се с нас.
      </p>
    </>
  );
}
