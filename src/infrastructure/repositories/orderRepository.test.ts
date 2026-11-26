import { describe, expect, it } from "vitest";
import { InMemoryOrderRepository } from "@/infrastructure/repositories/orderRepository";
import type { OrderDraft } from "@/domain/order/types";

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

describe("InMemoryOrderRepository", () => {
  it("delete removes the order so findById/findAll no longer see it", async () => {
    const repo = new InMemoryOrderRepository();
    await repo.save(makeOrder());

    await repo.delete("order-1");

    expect(await repo.findById("order-1")).toBeUndefined();
    expect(await repo.findAll()).toEqual([]);
  });

  it("delete is a no-op for an id that was never saved", async () => {
    const repo = new InMemoryOrderRepository();
    await expect(repo.delete("missing")).resolves.toBeUndefined();
  });
});
