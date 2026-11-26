import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDraft } from "@/domain/order/types";

const findAllMock = vi.fn<() => Promise<OrderDraft[]>>();
const reviewSaveMock = vi.fn();
const reviewFindByIdMock = vi.fn();
const sendMock = vi.fn();

vi.mock("@/infrastructure/repositories/orderRepository", () => ({
  orderRepository: { findAll: findAllMock },
}));
vi.mock("@/infrastructure/repositories/reviewRepository", () => ({
  reviewRepository: { save: reviewSaveMock, findById: reviewFindByIdMock },
}));
vi.mock("@/infrastructure/email/emailProvider", () => ({
  getEmailProvider: () => ({ send: sendMock }),
}));
vi.mock("@/lib/reviewConfirmationToken", () => ({
  isReviewConfirmationConfigured: () => true,
  createReviewConfirmationToken: vi.fn().mockResolvedValue("signed-token"),
}));

function order(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Test", phone: "0000", email: "buyer@example.com" },
    shippingDetails: {} as OrderDraft["shippingDetails"],
    items: [],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    totalEur: 25.5,
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  findAllMock.mockReset();
  reviewSaveMock.mockReset();
  reviewFindByIdMock.mockReset();
  sendMock.mockReset();
});

describe("hasDeliveredOrderForEmail", () => {
  it("is true when an order for that email is delivered", async () => {
    const { hasDeliveredOrderForEmail } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([order({ status: "shipped" }), order({ status: "delivered" })]);

    await expect(hasDeliveredOrderForEmail("Buyer@Example.com")).resolves.toBe(true);
  });

  it("is false when no order for that email was ever delivered", async () => {
    const { hasDeliveredOrderForEmail } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([order({ status: "shipped" })]);

    await expect(hasDeliveredOrderForEmail("buyer@example.com")).resolves.toBe(false);
  });

  it("is false when the email matches no order at all", async () => {
    const { hasDeliveredOrderForEmail } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([order({ customer: { fullName: "Test", phone: "0", email: "other@example.com" } })]);

    await expect(hasDeliveredOrderForEmail("buyer@example.com")).resolves.toBe(false);
  });
});

describe("submitReview", () => {
  const input = {
    rating: 5,
    body: "Страхотен комплект!",
    email: "buyer@example.com",
    displayName: "Купувач",
    isAnonymous: false,
  };

  it("always stores the review as pending, regardless of eligibility", async () => {
    const { submitReview } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([]);

    await submitReview(input);

    expect(reviewSaveMock).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", email: input.email }));
  });

  it("sends a confirmation email when the email has a delivered order", async () => {
    const { submitReview } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([
      order({ customer: { fullName: "T", phone: "0", email: input.email }, status: "delivered" }),
    ]);

    await submitReview(input);

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: input.email }));
  });

  it("does not send any email when the address has no delivered order", async () => {
    const { submitReview } = await import("@/infrastructure/reviews/reviewService");
    findAllMock.mockResolvedValue([]);

    await submitReview(input);

    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("confirmReview", () => {
  it("returns false for an unknown review id", async () => {
    const { confirmReview } = await import("@/infrastructure/reviews/reviewService");
    reviewFindByIdMock.mockResolvedValue(undefined);

    await expect(confirmReview("missing")).resolves.toBe(false);
    expect(reviewSaveMock).not.toHaveBeenCalled();
  });

  it("sets confirmedAt for a known, not-yet-confirmed review", async () => {
    const { confirmReview } = await import("@/infrastructure/reviews/reviewService");
    reviewFindByIdMock.mockResolvedValue({ id: "r1", confirmedAt: null });

    await expect(confirmReview("r1")).resolves.toBe(true);
    expect(reviewSaveMock).toHaveBeenCalledWith(expect.objectContaining({ id: "r1", confirmedAt: expect.any(String) }));
  });
});
