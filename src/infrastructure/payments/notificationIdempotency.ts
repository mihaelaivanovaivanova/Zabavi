/**
 * Tracks processed iCard notification IDs so a retried webhook never
 * applies the same payment twice. In-memory for the demo; Phase 2 should
 * back this with a persistent store shared across server instances.
 */
export interface NotificationIdempotencyStore {
  hasProcessed(notificationId: string): Promise<boolean>;
  markProcessed(notificationId: string): Promise<void>;
}

export class InMemoryNotificationIdempotencyStore implements NotificationIdempotencyStore {
  private readonly processedIds = new Set<string>();

  async hasProcessed(notificationId: string): Promise<boolean> {
    return this.processedIds.has(notificationId);
  }

  async markProcessed(notificationId: string): Promise<void> {
    this.processedIds.add(notificationId);
  }
}

export const notificationIdempotencyStore: NotificationIdempotencyStore =
  new InMemoryNotificationIdempotencyStore();
