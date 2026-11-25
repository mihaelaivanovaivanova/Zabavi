import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_SECRET = process.env.REVIEW_TOKEN_SECRET;

beforeEach(() => {
  process.env.REVIEW_TOKEN_SECRET = "test-secret";
  vi.useRealTimers();
});

afterEach(() => {
  process.env.REVIEW_TOKEN_SECRET = ORIGINAL_SECRET;
  vi.useRealTimers();
});

describe("isReviewConfirmationConfigured", () => {
  it("is true only when REVIEW_TOKEN_SECRET is set", async () => {
    const { isReviewConfirmationConfigured } = await import("@/lib/reviewConfirmationToken");
    expect(isReviewConfirmationConfigured()).toBe(true);

    delete process.env.REVIEW_TOKEN_SECRET;
    expect(isReviewConfirmationConfigured()).toBe(false);
  });
});

describe("review confirmation token", () => {
  it("round-trips: a freshly created token verifies back to the same review id", async () => {
    const { createReviewConfirmationToken, verifyReviewConfirmationToken } = await import(
      "@/lib/reviewConfirmationToken"
    );

    const token = await createReviewConfirmationToken("review-123");
    await expect(verifyReviewConfirmationToken(token)).resolves.toBe("review-123");
  });

  it("rejects a tampered token", async () => {
    const { createReviewConfirmationToken, verifyReviewConfirmationToken } = await import(
      "@/lib/reviewConfirmationToken"
    );

    const token = await createReviewConfirmationToken("review-123");
    const tampered = `${token}x`;
    await expect(verifyReviewConfirmationToken(tampered)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers();
    const { createReviewConfirmationToken, verifyReviewConfirmationToken } = await import(
      "@/lib/reviewConfirmationToken"
    );

    const token = await createReviewConfirmationToken("review-123");
    vi.advanceTimersByTime(1000 * 60 * 60 * 49); // past the 48h window

    await expect(verifyReviewConfirmationToken(token)).resolves.toBeNull();
  });

  it("returns null when REVIEW_TOKEN_SECRET is not configured", async () => {
    delete process.env.REVIEW_TOKEN_SECRET;
    const { verifyReviewConfirmationToken } = await import("@/lib/reviewConfirmationToken");

    await expect(verifyReviewConfirmationToken("anything")).resolves.toBeNull();
  });
});
