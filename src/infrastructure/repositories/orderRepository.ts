import type { OrderDraft } from "@/domain/order/types";

export interface OrderRepository {
  save(order: OrderDraft): Promise<void>;
  findById(id: string): Promise<OrderDraft | undefined>;
}

/**
 * In-memory implementation for the demo prototype only. State resets on
 * every server restart and is never persisted. Swap for a Postgres-backed
 * repository behind the same interface once production storage lands.
 */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, OrderDraft>();

  async save(order: OrderDraft): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<OrderDraft | undefined> {
    return this.orders.get(id);
  }
}

export const orderRepository: OrderRepository = new InMemoryOrderRepository();
