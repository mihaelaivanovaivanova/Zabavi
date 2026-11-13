import { Pool } from "pg";

declare global {
  var __zabaviPgPool: Pool | undefined;
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Single shared pool for every Postgres-backed repository. Stashed on
 * `globalThis` for the same reason as the order/kit repository singletons —
 * Route Handlers and Server Components can land in separate bundler module
 * graphs, each otherwise spinning up its own pool (and connection budget).
 */
export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!globalThis.__zabaviPgPool) {
    globalThis.__zabaviPgPool = new Pool({
      connectionString,
      // Railway (and most managed Postgres hosts) terminate TLS with a
      // certificate that isn't in Node's default trust store; this is the
      // standard pragmatic setting for that, not a blanket "skip TLS".
      ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    });
  }
  return globalThis.__zabaviPgPool;
}
