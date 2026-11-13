import type { Pool } from "pg";
import { defaultKitDetails, type KitDetails } from "@/domain/kit/types";
import type { KitRepository } from "@/infrastructure/repositories/kitRepository";
import { getPool, isPostgresConfigured } from "@/infrastructure/db/pool";

/**
 * Real persistence backing `KitRepository`, activated once `DATABASE_URL` is
 * set. Kept as JSONB for the same reason as `postgresOrderRepository.ts` —
 * no migration needed every time `KitDetails` grows a field.
 */
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS kits (
    variant_id TEXT PRIMARY KEY,
    updated_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL
  );
`;

declare global {
  var __zabaviKitsSchemaReady: Promise<void> | undefined;
}

function ensureSchema(pool: Pool): Promise<void> {
  if (!globalThis.__zabaviKitsSchemaReady) {
    globalThis.__zabaviKitsSchemaReady = pool.query(SCHEMA_SQL).then(() => undefined);
  }
  return globalThis.__zabaviKitsSchemaReady;
}

function rowToKit(payload: unknown): KitDetails {
  return payload as KitDetails;
}

export class PostgresKitRepository implements KitRepository {
  async get(variantId: string): Promise<KitDetails> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM kits WHERE variant_id = $1", [
      variantId,
    ]);
    const row = result.rows[0];
    return row ? rowToKit(row.payload) : defaultKitDetails(variantId);
  }

  async getMany(variantIds: string[]): Promise<KitDetails[]> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM kits WHERE variant_id = ANY($1)", [
      variantIds,
    ]);
    const byId = new Map(result.rows.map((row) => [rowToKit(row.payload).variantId, rowToKit(row.payload)]));
    return variantIds.map((id) => byId.get(id) ?? defaultKitDetails(id));
  }

  async save(details: KitDetails): Promise<void> {
    const pool = getPool();
    await ensureSchema(pool);
    await pool.query(
      `INSERT INTO kits (variant_id, updated_at, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (variant_id) DO UPDATE SET
         updated_at = EXCLUDED.updated_at,
         payload = EXCLUDED.payload`,
      [details.variantId, details.updatedAt, JSON.stringify(details)],
    );
  }
}

export { isPostgresConfigured };
