import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDraft } from "@/domain/order/types";

const sendMock = vi.fn();
const kitGetMock = vi.fn();

vi.mock("@/infrastructure/email/emailProvider", () => ({
  getEmailProvider: () => ({ send: sendMock }),
}));
vi.mock("@/infrastructure/repositories/kitRepository", () => ({
  kitRepository: { get: kitGetMock },
}));

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    orderNumber: "ZB-261126-AAAA",
    customer: { fullName: "Иван Иванов", phone: "0888123456", email: "ivan@example.bg" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 2 }],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    totalEur: 25.5,
    totalsSnapshot: { subtotalEur: 24, shippingEur: 0, codFeeEur: 1.5 },
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  sendMock.mockReset().mockResolvedValue(undefined);
  kitGetMock.mockReset().mockResolvedValue({ priceEur: 12 });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendOrderConfirmationEmail", () => {
  it("sends to the customer's email with the order number in the subject", async () => {
    const { sendOrderConfirmationEmail } = await import("@/infrastructure/email/orderEmails");
    await sendOrderConfirmationEmail(makeOrder());

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ivan@example.bg", subject: expect.stringContaining("ZB-261126-AAAA") }),
    );
  });

  it("does nothing when the order has no email on file (a manually-created order)", async () => {
    const { sendOrderConfirmationEmail } = await import("@/infrastructure/email/orderEmails");
    await sendOrderConfirmationEmail(makeOrder({ customer: { fullName: "Иван", phone: "0888123456" } }));
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("sendAdminOrderNotificationEmail", () => {
  it("sends one email per address in ORDER_NOTIFICATION_EMAILS", async () => {
    vi.stubEnv("ORDER_NOTIFICATION_EMAILS", "a@zabavi.bg, b@zabavi.bg");
    const { sendAdminOrderNotificationEmail } = await import("@/infrastructure/email/orderEmails");

    await sendAdminOrderNotificationEmail(makeOrder());

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "a@zabavi.bg" }));
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "b@zabavi.bg" }));
  });

  it("sends nothing when ORDER_NOTIFICATION_EMAILS is unset", async () => {
    const { sendAdminOrderNotificationEmail } = await import("@/infrastructure/email/orderEmails");
    await sendAdminOrderNotificationEmail(makeOrder());
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("sendOrderInvoiceEmail", () => {
  it("includes the registered seller identity and a per-item price breakdown", async () => {
    const { sendOrderInvoiceEmail } = await import("@/infrastructure/email/orderEmails");
    await sendOrderInvoiceEmail(makeOrder());

    expect(kitGetMock).toHaveBeenCalledWith("standard");
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("ЕИК");
    expect(html).toContain("208699419");
    expect(html).toContain("24.00"); // 12 * 2 line total
  });
});
