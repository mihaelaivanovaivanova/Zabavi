import type { Pool } from "pg";
import type { OrderDraft } from "@/domain/order/types";
import type { OrderRepository } from "@/infrastructure/repositories/orderRepository";
import { getPool, isPostgresConfigured } from "@/infrastructure/db/pool";

/**
 * Real persistence backing `OrderRepository`, activated once `DATABASE_URL`
 * is set. The full order is kept as JSONB so the schema doesn't need a
 * migration every time `OrderDraft` grows a field; `status`/`payment_status`/
 * `created_at` are duplicated into real columns purely so they can be
 * indexed/filtered without unpacking the JSON.
 */
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    payment_status TEXT,
    payload JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
`;

declare global {
  var __zabaviOrdersSchemaReady: Promise<void> | undefined;
}

function ensureSchema(pool: Pool): Promise<void> {
  if (!globalThis.__zabaviOrdersSchemaReady) {
    globalThis.__zabaviOrdersSchemaReady = pool.query(SCHEMA_SQL).then(() => undefined);
  }
  return globalThis.__zabaviOrdersSchemaReady;
}

function rowToOrder(payload: unknown): OrderDraft {
  return payload as OrderDraft;
}

export class PostgresOrderRepository implements OrderRepository {
  async save(order: OrderDraft): Promise<void> {
    const pool = getPool();
    await ensureSchema(pool);
    await pool.query(
      `INSERT INTO orders (id, created_at, status, payment_status, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         payload = EXCLUDED.payload`,
      [order.id, order.createdAt, order.status, order.paymentStatus ?? null, JSON.stringify(order)],
    );
  }

  async findById(id: string): Promise<OrderDraft | undefined> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM orders WHERE id = $1", [id]);
    const row = result.rows[0];
    return row ? rowToOrder(row.payload) : undefined;
  }

  async findAll(): Promise<OrderDraft[]> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM orders ORDER BY created_at DESC");
    return result.rows.map((row) => rowToOrder(row.payload));
  }
}

export { isPostgresConfigured };
