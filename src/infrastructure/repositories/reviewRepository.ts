import type { Review } from "@/domain/review/types";

export interface ReviewRepository {
  save(review: Review): Promise<void>;
  findById(id: string): Promise<Review | undefined>;
  findAll(): Promise<Review[]>;
  delete(id: string): Promise<void>;
}

/**
 * In-memory fallback for whenever `DATABASE_URL` isn't set. State resets on
 * every server restart and is never persisted — only meant for local/demo
 * use before a real database is configured.
 */
export class InMemoryReviewRepository implements ReviewRepository {
  private readonly reviews = new Map<string, Review>();

  async save(review: Review): Promise<void> {
    this.reviews.set(review.id, review);
  }

  async findById(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async findAll(): Promise<Review[]> {
    return [...this.reviews.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string): Promise<void> {
    this.reviews.delete(id);
  }
}

declare global {
  var __zabaviReviewRepository: ReviewRepository | undefined;
}

async function createReviewRepository(): Promise<ReviewRepository> {
  const { isPostgresConfigured, PostgresReviewRepository } = await import(
    "@/infrastructure/repositories/postgresReviewRepository"
  );
  return isPostgresConfigured() ? new PostgresReviewRepository() : new InMemoryReviewRepository();
}

/** Stashed on `globalThis` — see `orderRepository.ts` for why. */
let repositoryPromise: Promise<ReviewRepository> | undefined;

function getReviewRepositoryPromise(): Promise<ReviewRepository> {
  if (!globalThis.__zabaviReviewRepository) {
    if (!repositoryPromise) {
      repositoryPromise = createReviewRepository().then((repo) => {
        globalThis.__zabaviReviewRepository = repo;
        return repo;
      });
    }
    return repositoryPromise;
  }
  return Promise.resolve(globalThis.__zabaviReviewRepository);
}

/**
 * Real Postgres persistence once `DATABASE_URL` is set; otherwise the
 * in-memory demo fallback. Every method resolves the backing repository
 * lazily so the choice is made once per process and reused thereafter.
 */
export const reviewRepository: ReviewRepository = {
  async save(review) {
    const repo = await getReviewRepositoryPromise();
    return repo.save(review);
  },
  async findById(id) {
    const repo = await getReviewRepositoryPromise();
    return repo.findById(id);
  },
  async findAll() {
    const repo = await getReviewRepositoryPromise();
    return repo.findAll();
  },
  async delete(id) {
    const repo = await getReviewRepositoryPromise();
    return repo.delete(id);
  },
};
