export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

/**
 * A customer-submitted product review. Confirming the email link
 * (`confirmedAt`) only proves the submitter controls a real customer's
 * inbox — it does NOT publish the review. Only an admin explicitly setting
 * `status: "approved"` does that, so every review (new or legacy) stays
 * fully admin-managed, per the standing requirement.
 */
export interface Review {
  id: string;
  /** null only for the handful of legacy testimonials migrated in without an originally-collected rating. */
  rating: number | null;
  body: string;
  displayName: string;
  /** When true, the public site shows "Анонимен" instead of `displayName`. */
  isAnonymous: boolean;
  /** null only for migrated legacy testimonials; never shown publicly. */
  email: string | null;
  status: ReviewStatus;
  confirmedAt: string | null;
  createdAt: string;
}

/** What `/api/content/reviews` actually serves — an approved `Review` with the anonymity/email handling already applied, so no raw email ever reaches the client. */
export interface PublicReview {
  id: string;
  rating: number | null;
  body: string;
  displayName: string;
  createdAt: string;
}
