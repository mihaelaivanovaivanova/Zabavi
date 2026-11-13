import { defaultKitDetails, type KitDetails } from "@/domain/kit/types";

export interface KitRepository {
  get(variantId: string): Promise<KitDetails>;
  getMany(variantIds: string[]): Promise<KitDetails[]>;
  save(details: KitDetails): Promise<void>;
}

/**
 * In-memory fallback for whenever `DATABASE_URL` isn't set. State resets on
 * every server restart — only meant for local/demo use before a real
 * database is configured.
 */
export class InMemoryKitRepository implements KitRepository {
  private readonly kits = new Map<string, KitDetails>();

  async get(variantId: string): Promise<KitDetails> {
    return this.kits.get(variantId) ?? defaultKitDetails(variantId);
  }

  async getMany(variantIds: string[]): Promise<KitDetails[]> {
    return Promise.all(variantIds.map((id) => this.get(id)));
  }

  async save(details: KitDetails): Promise<void> {
    this.kits.set(details.variantId, details);
  }
}

declare global {
  var __zabaviKitRepository: KitRepository | undefined;
}

async function createKitRepository(): Promise<KitRepository> {
  const { isPostgresConfigured, PostgresKitRepository } = await import(
    "@/infrastructure/repositories/postgresKitRepository"
  );
  return isPostgresConfigured() ? new PostgresKitRepository() : new InMemoryKitRepository();
}

/**
 * Stashed on `globalThis` — see `orderRepository.ts` for why a plain
 * module-level singleton isn't safe across this bundler's module graphs.
 */
let repositoryPromise: Promise<KitRepository> | undefined;

function getKitRepositoryPromise(): Promise<KitRepository> {
  if (!globalThis.__zabaviKitRepository) {
    if (!repositoryPromise) {
      repositoryPromise = createKitRepository().then((repo) => {
        globalThis.__zabaviKitRepository = repo;
        return repo;
      });
    }
    return repositoryPromise;
  }
  return Promise.resolve(globalThis.__zabaviKitRepository);
}

/** Real Postgres persistence once `DATABASE_URL` is set; otherwise the in-memory demo fallback. */
export const kitRepository: KitRepository = {
  async get(variantId) {
    const repo = await getKitRepositoryPromise();
    return repo.get(variantId);
  },
  async getMany(variantIds) {
    const repo = await getKitRepositoryPromise();
    return repo.getMany(variantIds);
  },
  async save(details) {
    const repo = await getKitRepositoryPromise();
    return repo.save(details);
  },
};
