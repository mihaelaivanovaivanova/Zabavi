import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { testimonials } from "@/config/site";
import type { Review } from "@/domain/review/types";
import type { ReviewRepository } from "@/infrastructure/repositories/reviewRepository";
import { getPool, isPostgresConfigured } from "@/infrastructure/db/pool";

/**
 * Real persistence backing `ReviewRepository`, activated once `DATABASE_URL`
 * is set. Kept as JSONB for the same reason as `orders`/`kits` — no
 * migration needed every time `Review` grows a field.
 */
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    payload JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC);
`;

declare global {
  var __zabaviReviewsSchemaReady: Promise<void> | undefined;
}

/**
 * The 7 testimonials in `src/config/site.ts` are real quotes collected
 * before this review system existed, not placeholder content. Seeding them
 * as real, already-approved rows (once, only if the table is still empty)
 * is what makes them admin-manageable (hide/edit/delete) like every other
 * review, instead of a second hardcoded source the admin panel can't touch.
 */
async function seedLegacyTestimonialsIfEmpty(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM reviews");
  if (Number(rows[0]?.count ?? "0") > 0) return;

  const now = new Date().toISOString();
  for (const testimonial of testimonials) {
    const review: Review = {
      id: randomUUID(),
      rating: null,
      body: testimonial.quote,
      displayName: testimonial.author,
      isAnonymous: false,
      email: null,
      status: "approved",
      confirmedAt: null,
      createdAt: now,
    };
    await pool.query(
      `INSERT INTO reviews (id, created_at, status, payload) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [review.id, review.createdAt, review.status, JSON.stringify(review)],
    );
  }
}

function ensureSchema(pool: Pool): Promise<void> {
  if (!globalThis.__zabaviReviewsSchemaReady) {
    globalThis.__zabaviReviewsSchemaReady = pool
      .query(SCHEMA_SQL)
      .then(() => seedLegacyTestimonialsIfEmpty(pool));
  }
  return globalThis.__zabaviReviewsSchemaReady;
}

function rowToReview(payload: unknown): Review {
  return payload as Review;
}

export class PostgresReviewRepository implements ReviewRepository {
  async save(review: Review): Promise<void> {
    const pool = getPool();
    await ensureSchema(pool);
    await pool.query(
      `INSERT INTO reviews (id, created_at, status, payload)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payload = EXCLUDED.payload`,
      [review.id, review.createdAt, review.status, JSON.stringify(review)],
    );
  }

  async findById(id: string): Promise<Review | undefined> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM reviews WHERE id = $1", [id]);
    const row = result.rows[0];
    return row ? rowToReview(row.payload) : undefined;
  }

  async findAll(): Promise<Review[]> {
    const pool = getPool();
    await ensureSchema(pool);
    const result = await pool.query<{ payload: unknown }>("SELECT payload FROM reviews ORDER BY created_at DESC");
    return result.rows.map((row) => rowToReview(row.payload));
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await ensureSchema(pool);
    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
  }
}

export { isPostgresConfigured };
