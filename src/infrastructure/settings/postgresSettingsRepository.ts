import type { Pool } from "pg";
import type { IntegrationProvider, SettingsRepository } from "@/infrastructure/settings/settingsRepository";
import { getPool, isPostgresConfigured } from "@/infrastructure/db/pool";

/**
 * Real persistence backing `SettingsRepository`, activated once
 * `DATABASE_URL` is set — same JSONB-payload shape as
 * `postgresKitRepository.ts`, keyed by integration instead of variant.
 * Secret fields inside the payload are pre-encrypted by the caller (the
 * per-integration settings service) before this ever sees them — this
 * repository just persists whatever JSON it's given.
 */
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS integration_settings (
    provider TEXT PRIMARY KEY,
    updated_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL
  );
`;

declare global {
  var __zabaviSettingsSchemaReady: Promise<void> | undefined;
}

function ensureSchema(pool: Pool): Promise<void> {
  if (!globalThis.__zabaviSettingsSchemaReady) {
    globalThis.__zabaviSettingsSchemaReady = pool.query(SCHEMA_SQL).then(() => undefined);
  }
  return globalThis.__zabaviSettingsSchemaReady;
}

export class PostgresSettingsRepository implements SettingsRepository {
  async get(provider: IntegrationProvider): Promise<Record<string, unknown> | null> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>(
      "SELECT payload FROM integration_settings WHERE provider = $1",
      [provider],
    );
    const row = result.rows[0];
    return row ? (row.payload as Record<string, unknown>) : null;
  }

  async save(provider: IntegrationProvider, payload: Record<string, unknown>): Promise<void> {
    const pool = getPool();
    await ensureSchema(pool);
    await pool.query(
      `INSERT INTO integration_settings (provider, updated_at, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider) DO UPDATE SET
         updated_at = EXCLUDED.updated_at,
         payload = EXCLUDED.payload`,
      [provider, new Date().toISOString(), JSON.stringify(payload)],
    );
  }
}

export { isPostgresConfigured };
