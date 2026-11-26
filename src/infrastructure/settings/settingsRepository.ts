/** Despite the name, also covers non-integration site copy (e.g. "illustrations_section") — it's really just a generic settings key. */
export type IntegrationProvider =
  | "icard"
  | "box_now"
  | "speedy"
  | "illustrations_section"
  | "faq"
  | "objections"
  | "checkout";

export interface SettingsRepository {
  get(provider: IntegrationProvider): Promise<Record<string, unknown> | null>;
  save(provider: IntegrationProvider, payload: Record<string, unknown>): Promise<void>;
}

/**
 * In-memory fallback for whenever `DATABASE_URL` isn't set — same
 * demo-only caveat as `InMemoryKitRepository`: state resets on every
 * server restart.
 */
export class InMemorySettingsRepository implements SettingsRepository {
  private readonly rows = new Map<IntegrationProvider, Record<string, unknown>>();

  async get(provider: IntegrationProvider): Promise<Record<string, unknown> | null> {
    return this.rows.get(provider) ?? null;
  }

  async save(provider: IntegrationProvider, payload: Record<string, unknown>): Promise<void> {
    this.rows.set(provider, payload);
  }
}

declare global {
  var __zabaviSettingsRepository: SettingsRepository | undefined;
}

async function createSettingsRepository(): Promise<SettingsRepository> {
  const { isPostgresConfigured, PostgresSettingsRepository } = await import(
    "@/infrastructure/settings/postgresSettingsRepository"
  );
  return isPostgresConfigured() ? new PostgresSettingsRepository() : new InMemorySettingsRepository();
}

/** Stashed on `globalThis` — see `kitRepository.ts` for why. */
let repositoryPromise: Promise<SettingsRepository> | undefined;

function getSettingsRepositoryPromise(): Promise<SettingsRepository> {
  if (!globalThis.__zabaviSettingsRepository) {
    if (!repositoryPromise) {
      repositoryPromise = createSettingsRepository().then((repo) => {
        globalThis.__zabaviSettingsRepository = repo;
        return repo;
      });
    }
    return repositoryPromise;
  }
  return Promise.resolve(globalThis.__zabaviSettingsRepository);
}

/** Real Postgres persistence once `DATABASE_URL` is set; otherwise the in-memory demo fallback. */
export const settingsRepository: SettingsRepository = {
  async get(provider) {
    const repo = await getSettingsRepositoryPromise();
    return repo.get(provider);
  },
  async save(provider, payload) {
    const repo = await getSettingsRepositoryPromise();
    return repo.save(provider, payload);
  },
};
