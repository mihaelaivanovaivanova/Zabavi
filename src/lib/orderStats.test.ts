import { describe, expect, it } from "vitest";
import { computeOrderStats, isDueForReminder, orderDisplayStatus } from "@/lib/orderStats";
import type { OrderDraft, OrderStatus } from "@/domain/order/types";

function makeOrder(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: "order-1",
    customer: { fullName: "Иван Иванов", phone: "0888123456" },
    shippingDetails: { method: "courier", address: "ул. Тест 1", city: "София", postalCode: "1000" },
    items: [{ productSlug: "akvarelen-nabor", variantId: "standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    totalEur: 25.5,
    statusHistory: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("orderDisplayStatus", () => {
  const cases: [OrderStatus, string][] = [
    ["awaiting_payment", "Очаква плащане"],
    ["paid", "Платена"],
    ["confirmed", "Потвърдена"],
    ["packed", "Опакована"],
    ["shipped", "Изпратена"],
    ["delivered", "Доставена"],
    ["returned", "Върната"],
    ["cancelled", "Отказана"],
    ["refunded", "Възстановена"],
    ["failed", "Неуспешна"],
  ];

  it.each(cases)("labels status %s as %s", (status, label) => {
    expect(orderDisplayStatus(makeOrder({ status })).label).toBe(label);
  });
});

describe("isDueForReminder", () => {
  it("is true only for an order stuck awaiting payment for over 24h", () => {
    const stuckOrder = makeOrder({
      status: "awaiting_payment",
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    expect(isDueForReminder(stuckOrder)).toBe(true);

    const recentOrder = makeOrder({ status: "awaiting_payment", createdAt: new Date().toISOString() });
    expect(isDueForReminder(recentOrder)).toBe(false);

    const confirmedOrder = makeOrder({
      status: "confirmed",
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    expect(isDueForReminder(confirmedOrder)).toBe(false);
  });
});

describe("computeOrderStats", () => {
  it("sums known totals, excluding cancelled/failed/refunded orders", () => {
    const stats = computeOrderStats([
      makeOrder({ id: "1", status: "paid", totalEur: 10 }),
      makeOrder({ id: "2", status: "delivered", totalEur: 20 }),
      makeOrder({ id: "3", status: "cancelled", totalEur: 1000 }),
      makeOrder({ id: "4", status: "failed", totalEur: 1000 }),
      makeOrder({ id: "5", status: "refunded", totalEur: 1000 }),
    ]);
    expect(stats.totalRevenueEur).toBe(30);
  });

  it("returns null revenue when every order's price is still TBD", () => {
    const stats = computeOrderStats([makeOrder({ totalEur: null }), makeOrder({ totalEur: null })]);
    expect(stats.totalRevenueEur).toBeNull();
  });

  it("counts orders per status", () => {
    const stats = computeOrderStats([
      makeOrder({ id: "1", status: "awaiting_payment" }),
      makeOrder({ id: "2", status: "awaiting_payment" }),
      makeOrder({ id: "3", status: "shipped" }),
    ]);
    expect(stats.statusCounts.awaiting_payment).toBe(2);
    expect(stats.statusCounts.shipped).toBe(1);
    expect(stats.statusCounts.delivered).toBe(0);
    expect(stats.total).toBe(3);
  });
});
