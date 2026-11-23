"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderDraft, OrderStatus } from "@/domain/order/types";
import type { DeliveryMethodId } from "@/domain/shipping/types";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { StatTile } from "@/components/admin/StatTile";
import { computeOrderStats, isDueForReminder, latestShipmentEvent } from "@/lib/orderStats";
import { formatEur } from "@/lib/format";

type StatusFilter = "all" | OrderStatus;
type DeliveryFilter = "all" | DeliveryMethodId;
type SortOrder = "newest" | "oldest";

function orderDisplayNumber(order: OrderDraft): string {
  return order.orderNumber ?? order.id.slice(0, 8).toUpperCase();
}

export function AdminDashboard({ orders }: { orders: OrderDraft[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [hideCancelled, setHideCancelled] = useState(false);
  const [dueForReminderOnly, setDueForReminderOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;

    const filtered = orders.filter((order) => {
      if (hideCancelled && order.status === "cancelled") return false;
      if (dueForReminderOnly && !isDueForReminder(order)) return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (deliveryFilter !== "all" && order.shippingDetails.method !== deliveryFilter) return false;

      const createdMs = new Date(order.createdAt).getTime();
      if (fromMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs > toMs) return false;

      if (query) {
        const tracking = latestShipmentEvent(order)?.parcelId ?? "";
        const haystack = [
          orderDisplayNumber(order),
          order.id,
          order.customer.fullName,
          order.customer.email ?? "",
          order.customer.phone,
          tracking,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return filtered;
  }, [orders, search, statusFilter, deliveryFilter, dateFrom, dateTo, sortOrder, hideCancelled, dueForReminderOnly]);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Общо поръчки" value={String(stats.total)} />
        <StatTile label="Днес" value={String(stats.today)} />
        <StatTile label="Чакащи" value={String(stats.pending)} />
        <StatTile
          label="За напомняне"
          value={String(stats.dueForReminder)}
          hint="Чакащи повече от 24ч"
        />
        <StatTile label="Потвърдени" value={String(stats.confirmed)} />
        <StatTile label="Отказани" value={String(stats.cancelled)} />
        <StatTile label="Уникални клиенти" value={String(stats.uniqueCustomers)} />
        <StatTile label="Обща сума" value={formatEur(null)} hint="Цената предстои да се зададе" />
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink-900">Поръчки</h2>
        <Button type="button" variant="secondary" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Опресняване…" : "Опресни"}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder="Търси по номер, име, телефон, имейл или проследяване…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${inputClasses} min-w-[18rem] flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className={inputClasses}
        >
          <option value="all">Всички статуси</option>
          <option value="pending">Чакащи</option>
          <option value="confirmed">Потвърдени</option>
          <option value="cancelled">Отказани</option>
        </select>
        <select
          value={deliveryFilter}
          onChange={(event) => setDeliveryFilter(event.target.value as DeliveryFilter)}
          className={inputClasses}
        >
          <option value="all">Всички доставки</option>
          <option value="courier">Куриер</option>
          <option value="box_now">BOX NOW</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className={inputClasses}
          aria-label="От дата"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className={inputClasses}
          aria-label="До дата"
        />
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          className={inputClasses}
        >
          <option value="newest">Най-нови първо</option>
          <option value="oldest">Най-стари първо</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-sm text-ink-800">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hideCancelled} onChange={(event) => setHideCancelled(event.target.checked)} />
          Скрий отказаните
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dueForReminderOnly}
            onChange={(event) => setDueForReminderOnly(event.target.checked)}
          />
          Само за напомняне
        </label>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="mt-8 text-ink-700">Няма поръчки, отговарящи на филтъра.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-lavender-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-lavender-50 text-ink-800">
              <tr>
                <th className="px-4 py-3">Поръчка №</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Подадена</th>
                <th className="px-4 py-3">Артикули</th>
                <th className="px-4 py-3">Проследяване</th>
                <th className="px-4 py-3">Сума</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-lavender-200">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {orderDisplayNumber(order)}
                    {isDueForReminder(order) ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-accent-400/15 px-2 py-0.5 text-xs font-semibold text-accent-600">
                        напомняне
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {order.customer.fullName}
                    <span className="block text-xs text-ink-700">{order.customer.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{order.status}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-700">
                    {new Date(order.createdAt).toLocaleString("bg-BG")}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {order.items.map((item) => `${item.variantId} × ${item.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {order.shippingDetails.method}
                    {latestShipmentEvent(order) ? ` — ${latestShipmentEvent(order)?.event}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatEur(null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
