import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { OrderDraft } from "@/domain/order/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    orderNumber: "ZB-261126-AAAA",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    totalEur: 29.99,
    trackingNumber: "9871415586",
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("AdminDashboard", () => {
  it("shows the order's real tracking number, total, and a view link, same columns as smisul.bg", () => {
    render(<AdminDashboard orders={[makeOrder()]} />);

    expect(screen.getByText("ZB-261126-AAAA")).toBeInTheDocument();
    expect(screen.getByText("9871415586")).toBeInTheDocument();
    expect(screen.getAllByText("29.99 €").length).toBeGreaterThan(0);
    expect(screen.getByText("Преглед")).toHaveAttribute(
      "href",
      "/admin/orders/11111111-1111-1111-1111-111111111111",
    );
  });

  it("shows a dash instead of a tracking number for an order with none yet", () => {
    render(<AdminDashboard orders={[makeOrder({ trackingNumber: undefined })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("badges a paid order distinctly from one still awaiting card payment", () => {
    render(
      <AdminDashboard
        orders={[
          makeOrder({ id: "a", status: "paid" }),
          makeOrder({ id: "b", paymentMethod: "card_icard", status: "awaiting_payment" }),
        ]}
      />,
    );

    expect(screen.getAllByText("Платена", { selector: "span" })).toHaveLength(1);
    expect(screen.getAllByText("Очаква плащане", { selector: "span" })).toHaveLength(1);
  });
});
