import type { OrderDraft } from "@/domain/order/types";

/** Orders stuck in "pending" this long likely need a manual follow-up (payment/shipment never confirmed). */
export const REMINDER_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function isDueForReminder(order: OrderDraft, now: number = Date.now()): boolean {
  if (order.status !== "pending") return false;
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

export interface OrderStats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  dueForReminder: number;
  uniqueCustomers: number;
}

export function computeOrderStats(orders: OrderDraft[], now: Date = new Date()): OrderStats {
  const uniquePhones = new Set(orders.map((order) => order.customer.phone));

  return {
    total: orders.length,
    today: orders.filter((order) => isSameDay(order.createdAt, now)).length,
    pending: orders.filter((order) => order.status === "pending").length,
    confirmed: orders.filter((order) => order.status === "confirmed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    dueForReminder: orders.filter((order) => isDueForReminder(order, now.getTime())).length,
    uniqueCustomers: uniquePhones.size,
  };
}
