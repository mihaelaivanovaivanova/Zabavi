import type { OrderDraft, OrderStatus } from "@/domain/order/types";
import type { BadgeTone } from "@/components/ui/Badge";

/** Bulgarian label + badge tone for each of the 10 order statuses — see `OrderStatus`'s own doc comment. */
const ORDER_STATUS_DISPLAY: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  awaiting_payment: { label: "Очаква плащане", tone: "warning" },
  paid: { label: "Платена", tone: "success" },
  confirmed: { label: "Потвърдена", tone: "success" },
  packed: { label: "Опакована", tone: "neutral" },
  shipped: { label: "Изпратена", tone: "neutral" },
  delivered: { label: "Доставена", tone: "success" },
  returned: { label: "Върната", tone: "danger" },
  cancelled: { label: "Отказана", tone: "danger" },
  refunded: { label: "Възстановена", tone: "neutral" },
  failed: { label: "Неуспешна", tone: "danger" },
};

export function orderStatusDisplay(status: OrderStatus): { label: string; tone: BadgeTone } {
  return ORDER_STATUS_DISPLAY[status];
}

export function orderDisplayStatus(order: OrderDraft): { label: string; tone: BadgeTone } {
  return orderStatusDisplay(order.status);
}

/** Orders stuck awaiting a card payment this long likely need a manual follow-up (payment never completed/abandoned). */
export const REMINDER_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function isDueForReminder(order: OrderDraft, now: number = Date.now()): boolean {
  if (order.status !== "awaiting_payment") return false;
  return now - new Date(order.createdAt).getTime() > REMINDER_THRESHOLD_MS;
}

export function latestShipmentEvent(order: OrderDraft) {
  if (!order.shipmentEvents || order.shipmentEvents.length === 0) return undefined;
  return order.shipmentEvents[order.shipmentEvents.length - 1];
}

function isSameDay(isoDate: string, reference: Date): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

/** Statuses that count as "the sale didn't go through" — excluded from revenue and treated as the dashboard's one combined "problem" bucket. */
const LOST_STATUSES: ReadonlySet<OrderStatus> = new Set(["cancelled", "failed", "refunded"]);

export interface OrderStats {
  total: number;
  today: number;
  dueForReminder: number;
  uniqueCustomers: number;
  /** Sum of non-lost orders' `totalEur`, ignoring any still-TBD (`null`) ones; `null` when none are known yet. */
  totalRevenueEur: number | null;
  statusCounts: Record<OrderStatus, number>;
}

export function computeOrderStats(orders: OrderDraft[], now: Date = new Date()): OrderStats {
  const uniquePhones = new Set(orders.map((order) => order.customer.phone));
  const knownTotals = orders
    .filter((order) => !LOST_STATUSES.has(order.status))
    .map((order) => order.totalEur)
    .filter((totalEur): totalEur is number => totalEur !== null && totalEur !== undefined);

  const statusCounts = {
    awaiting_payment: 0,
    paid: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    refunded: 0,
    failed: 0,
  } satisfies Record<OrderStatus, number>;
  for (const order of orders) {
    statusCounts[order.status]++;
  }

  return {
    total: orders.length,
    today: orders.filter((order) => isSameDay(order.createdAt, now)).length,
    dueForReminder: orders.filter((order) => isDueForReminder(order, now.getTime())).length,
    uniqueCustomers: uniquePhones.size,
    totalRevenueEur: knownTotals.length > 0 ? knownTotals.reduce((sum, value) => sum + value, 0) : null,
    statusCounts,
  };
}
