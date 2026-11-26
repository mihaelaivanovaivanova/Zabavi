import type { OrderDraft } from "@/domain/order/types";

export interface OrderRepository {
  save(order: OrderDraft): Promise<void>;
  findById(id: string): Promise<OrderDraft | undefined>;
  findAll(): Promise<OrderDraft[]>;
  delete(id: string): Promise<void>;
}

/**
 * In-memory fallback for whenever `DATABASE_URL` isn't set. State resets on
 * every server restart and is never persisted — only meant for local/demo
 * use before a real database is configured.
 */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, OrderDraft>();

  async save(order: OrderDraft): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<OrderDraft | undefined> {
    return this.orders.get(id);
  }

  async findAll(): Promise<OrderDraft[]> {
    return [...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string): Promise<void> {
    this.orders.delete(id);
  }
}

declare global {
  var __zabaviOrderRepository: OrderRepository | undefined;
}

async function createOrderRepository(): Promise<OrderRepository> {
  const { isPostgresConfigured, PostgresOrderRepository } = await import(
    "@/infrastructure/repositories/postgresOrderRepository"
  );
  return isPostgresConfigured() ? new PostgresOrderRepository() : new InMemoryOrderRepository();
}

/**
 * Stashed on `globalThis` rather than a plain module-level singleton: Route
 * Handlers and Server Components can end up in separate bundler module
 * graphs, each with their own copy of this module otherwise, which would
 * silently split the "shared" store into two (bit us once already with the
 * in-memory version — see git history). The dynamic import keeps `pg` out
 * of the Edge-runtime bundle graph for callers that never touch Postgres.
 */
let repositoryPromise: Promise<OrderRepository> | undefined;

function getOrderRepositoryPromise(): Promise<OrderRepository> {
  if (!globalThis.__zabaviOrderRepository) {
    if (!repositoryPromise) {
      repositoryPromise = createOrderRepository().then((repo) => {
        globalThis.__zabaviOrderRepository = repo;
        return repo;
      });
    }
    return repositoryPromise;
  }
  return Promise.resolve(globalThis.__zabaviOrderRepository);
}

/**
 * Real Postgres persistence once `DATABASE_URL` is set; otherwise the
 * in-memory demo fallback. Every method resolves the backing repository
 * lazily so the choice is made once per process and reused thereafter.
 */
export const orderRepository: OrderRepository = {
  async save(order) {
    const repo = await getOrderRepositoryPromise();
    return repo.save(order);
  },
  async findById(id) {
    const repo = await getOrderRepositoryPromise();
    return repo.findById(id);
  },
  async findAll() {
    const repo = await getOrderRepositoryPromise();
    return repo.findAll();
  },
  async delete(id) {
    const repo = await getOrderRepositoryPromise();
    return repo.delete(id);
  },
};
