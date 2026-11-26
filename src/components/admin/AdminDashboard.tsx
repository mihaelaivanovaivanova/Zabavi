"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OrderDraft, OrderStatus } from "@/domain/order/types";
import type { DeliveryMethodId } from "@/domain/shipping/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { StatTile } from "@/components/admin/StatTile";
import { computeOrderStats, isDueForReminder, latestShipmentEvent, orderDisplayStatus } from "@/lib/orderStats";
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
        const tracking = order.trackingNumber ?? latestShipmentEvent(order)?.parcelId ?? "";
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
        <StatTile
          label="За напомняне"
          value={String(stats.dueForReminder)}
          hint="Очакват плащане повече от 24ч"
        />
        <StatTile label="Очакват плащане" value={String(stats.statusCounts.awaiting_payment)} />
        <StatTile label="Потвърдени" value={String(stats.statusCounts.paid + stats.statusCounts.confirmed)} />
        <StatTile label="Изпратени" value={String(stats.statusCounts.shipped)} />
        <StatTile label="Доставени" value={String(stats.statusCounts.delivered)} />
        <StatTile
          label="Отказани/неуспешни"
          value={String(stats.statusCounts.cancelled + stats.statusCounts.failed + stats.statusCounts.returned)}
        />
        <StatTile label="Уникални клиенти" value={String(stats.uniqueCustomers)} />
        <StatTile
          label="Обща сума"
          value={formatEur(stats.totalRevenueEur)}
          hint={stats.totalRevenueEur === null ? "Цената предстои да се зададе" : "Без отказаните поръчки"}
        />
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
          <option value="awaiting_payment">Очаква плащане</option>
          <option value="paid">Платена</option>
          <option value="confirmed">Потвърдена</option>
          <option value="packed">Опакована</option>
          <option value="shipped">Изпратена</option>
          <option value="delivered">Доставена</option>
          <option value="returned">Върната</option>
          <option value="cancelled">Отказана</option>
          <option value="refunded">Възстановена</option>
          <option value="failed">Неуспешна</option>
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
                <th className="px-4 py-3">Проследяване №</th>
                <th className="px-4 py-3">Сума</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const displayStatus = orderDisplayStatus(order);
                return (
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
                    <td className="px-4 py-3">
                      <Badge tone={displayStatus.tone}>{displayStatus.label}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-700">
                      {new Date(order.createdAt).toLocaleString("bg-BG")}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {order.items.map((item) => `${item.variantId} × ${item.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{order.trackingNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-700">{formatEur(order.totalEur ?? null)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-burgundy-700 underline">
                        Преглед
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
