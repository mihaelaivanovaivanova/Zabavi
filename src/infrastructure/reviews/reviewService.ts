import { randomUUID } from "node:crypto";
import { siteConfig } from "@/config/site";
import type { Review } from "@/domain/review/types";
import { getEmailProvider } from "@/infrastructure/email/emailProvider";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { reviewRepository } from "@/infrastructure/repositories/reviewRepository";
import { createReviewConfirmationToken, isReviewConfirmationConfigured } from "@/lib/reviewConfirmationToken";

export async function hasDeliveredOrderForEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const orders = await orderRepository.findAll();
  return orders.some(
    (order) => order.customer.email?.trim().toLowerCase() === normalized && order.status === "delivered",
  );
}

export interface SubmitReviewInput {
  rating: number;
  body: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
}

function escapeHtml(value: string): string {
  const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => escapes[char]);
}

/**
 * Always stores the review (an admin can moderate it either way, confirmed
 * or not) and always resolves the same way regardless of what it finds —
 * whether a confirmation email actually went out is never surfaced to the
 * caller, so the response can't be used to probe which email addresses
 * belong to real customers.
 */
export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const review: Review = {
    id: randomUUID(),
    rating: input.rating,
    body: input.body,
    displayName: input.displayName,
    isAnonymous: input.isAnonymous,
    email: input.email,
    status: "pending",
    confirmedAt: null,
    createdAt: new Date().toISOString(),
  };
  await reviewRepository.save(review);

  if (!isReviewConfirmationConfigured()) return;
  const eligible = await hasDeliveredOrderForEmail(input.email);
  if (!eligible) return;

  const token = await createReviewConfirmationToken(review.id);
  const confirmUrl = `${siteConfig.brand.url}/reviews/confirm/${token}`;
  await getEmailProvider().send({
    to: input.email,
    subject: `Потвърди отзива си за ${siteConfig.brand.name}`,
    html: `
      <p>Здравей, ${escapeHtml(input.displayName)},</p>
      <p>Благодарим ти, че отдели време да споделиш отзив за ${escapeHtml(siteConfig.brand.name)}!</p>
      <p>Моля, потвърди го, като натиснеш бутона по-долу:</p>
      <p>
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#7a2e3a;color:#fff;border-radius:999px;text-decoration:none;">
          Потвърди отзива
        </a>
      </p>
      <p>Линкът е валиден 48 часа.</p>
    `,
  });
}

/** Returns false when the review doesn't exist; idempotent otherwise (re-confirming an already-confirmed review is a no-op, not an error). */
export async function confirmReview(reviewId: string): Promise<boolean> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) return false;
  if (!review.confirmedAt) {
    await reviewRepository.save({ ...review, confirmedAt: new Date().toISOString() });
  }
  return true;
}
