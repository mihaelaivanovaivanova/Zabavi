import { NextResponse, connection } from "next/server";
import { reviewRepository } from "@/infrastructure/repositories/reviewRepository";

/** Public, read-only: only admin-approved reviews, for the landing page's testimonials section. */
export async function GET() {
  await connection();
  const reviews = await reviewRepository.findAll();
  const approved = reviews
    .filter((review) => review.status === "approved")
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      displayName: review.isAnonymous ? "Анонимен" : review.displayName,
      createdAt: review.createdAt,
    }));
  return NextResponse.json({ reviews: approved });
}
