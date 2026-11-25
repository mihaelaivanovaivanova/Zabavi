/**
 * Signed, expiring link embedded in the "confirm your review" email — see
 * `src/lib/hmac.ts` for the shared signing primitives (same scheme as the
 * admin session cookie, different secret/payload).
 */
import { createSignedToken, verifySignedToken } from "@/lib/hmac";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 48; // 48h, same window Smisul uses.

interface ReviewTokenPayload {
  reviewId: string;
  exp: number;
}

function requireTokenSecret(): string {
  const secret = process.env.REVIEW_TOKEN_SECRET;
  if (!secret) {
    throw new Error("REVIEW_TOKEN_SECRET is not set — review confirmation links are disabled until it is configured.");
  }
  return secret;
}

export function isReviewConfirmationConfigured(): boolean {
  return Boolean(process.env.REVIEW_TOKEN_SECRET);
}

export async function createReviewConfirmationToken(reviewId: string): Promise<string> {
  const secret = requireTokenSecret();
  const payload: ReviewTokenPayload = { reviewId, exp: Date.now() + TOKEN_TTL_MS };
  return createSignedToken(secret, payload);
}

/** Returns the review id the token was issued for, or null if the token is missing, unconfigured, invalid, or expired. */
export async function verifyReviewConfirmationToken(token: string): Promise<string | null> {
  let secret: string;
  try {
    secret = requireTokenSecret();
  } catch {
    return null;
  }

  const payload = await verifySignedToken<ReviewTokenPayload>(secret, token);
  if (!payload || typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
  return payload.reviewId;
}
