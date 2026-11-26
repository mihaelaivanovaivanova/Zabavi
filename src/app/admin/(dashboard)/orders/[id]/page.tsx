import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/ui/Badge";
import { OrderActionsPanel } from "@/components/admin/OrderActionsPanel";
import { product } from "@/config/site";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";
import { orderDisplayStatus, orderStatusDisplay } from "@/lib/orderStats";
import { formatEur } from "@/lib/format";
import { allowedTransitions } from "@/domain/order/orderStatusService";
import { shipmentStatusLabel } from "@/domain/shipping/types";
import { shippingAddressLine } from "@/infrastructure/email/orderEmails";
import type { OrderDraft } from "@/domain/order/types";

/**
 * Unlike `kits/[variantId]` (whose variants are all known via
 * generateStaticParams), this route has no fixed set of ids — Next tries to
 * build a static shell for the "unknown id" case anyway (Cache Components'
 * per-route shell validation), which trips over the shared admin layout's
 * `AdminNav` reading `usePathname()` with no Suspense boundary around it.
 * An order detail page is 100% request-time data by nature, so there's no
 * meaningful static shell to produce here regardless — opting out is the
 * correct fix, not a workaround. See node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/02-route-segment-config/instant.md.
 */
export const instant = false;

function orderDisplayNumber(order: OrderDraft): string {
  return order.orderNumber ?? order.id.slice(0, 8).toUpperCase();
}

function itemLabel(variantId: string): string {
  return product.variants.find((variant) => variant.id === variantId)?.label ?? variantId;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <Link href="/admin" className="text-sm text-burgundy-700 underline">
        ← Всички поръчки
      </Link>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <OrderDetailSection id={id} />
      </Suspense>
    </div>
  );
}

async function OrderDetailSection({ id }: { id: string }) {
  // In-memory repo read has no request-time signal of its own — opt out of
  // the static shell so this never serves a frozen build-time snapshot.
  await connection();
  const order = await orderRepository.findById(id);
  if (!order) {
    notFound();
  }

  const displayStatus = orderDisplayStatus(order);
  const itemRows = await Promise.all(
    order.items.map(async (item) => {
      const kit = await kitRepository.get(item.variantId);
      const unitPrice = kit.priceEur;
      return {
        label: itemLabel(item.variantId),
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice !== null ? unitPrice * item.quantity : null,
      };
    }),
  );

  return (
    <div className="mt-4 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink-900">Поръчка {orderDisplayNumber(order)}</h1>
          <Badge tone={displayStatus.tone}>{displayStatus.label}</Badge>
        </div>
        <p className="text-sm text-ink-700">{new Date(order.createdAt).toLocaleString("bg-BG")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Артикули</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-ink-700">
                <tr>
                  <th className="pb-2">Артикул</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">Бр.</th>
                  <th className="pb-2 text-right">Ед. цена</th>
                  <th className="pb-2 text-right">Сума</th>
                </tr>
              </thead>
              <tbody className="text-ink-800">
                {itemRows.map((row, index) => (
                  <tr key={index} className="border-t border-lavender-200">
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-ink-700">{row.variantId}</td>
                    <td className="py-2 text-right">{row.quantity}</td>
                    <td className="py-2 text-right">{formatEur(row.unitPrice)}</td>
                    <td className="py-2 text-right">{formatEur(row.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 border-t border-lavender-200 pt-3 text-sm text-ink-800">
              <div className="flex justify-between">
                <dt>Междинна сума</dt>
                <dd>{formatEur(order.totalsSnapshot?.subtotalEur ?? null)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Отстъпка</dt>
                <dd>{formatEur(0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Доставка</dt>
                <dd>{formatEur(order.totalsSnapshot?.shippingEur ?? null)}</dd>
              </div>
              {order.paymentMethod === "cash_on_delivery" ? (
                <div className="flex justify-between">
                  <dt>Такса наложен платеж</dt>
                  <dd>{formatEur(order.totalsSnapshot?.codFeeEur ?? null)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-lavender-200 pt-1 font-semibold text-ink-900">
                <dt>Обща сума</dt>
                <dd>{formatEur(order.totalEur)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">История</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.statusHistory.map((entry, index) => (
                <li key={index} className="flex flex-wrap items-center justify-between gap-2 border-t border-lavender-200 pt-2 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={orderStatusDisplay(entry.status).tone}>{orderStatusDisplay(entry.status).label}</Badge>
                    {entry.note ? <span className="text-ink-700">{entry.note}</span> : null}
                  </div>
                  <span className="text-xs text-ink-700">{new Date(entry.occurredAt).toLocaleString("bg-BG")}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Плащания</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-ink-700">
                <tr>
                  <th className="pb-2">Начин</th>
                  <th className="pb-2">Статус</th>
                  <th className="pb-2 text-right">Сума</th>
                </tr>
              </thead>
              <tbody className="text-ink-800">
                <tr className="border-t border-lavender-200">
                  <td className="py-2">{order.paymentMethod === "card_icard" ? "Карта (iCard)" : "Наложен платеж"}</td>
                  <td className="py-2">{order.paymentStatus ?? "pending"}</td>
                  <td className="py-2 text-right">{formatEur(order.totalEur)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Пратка</h2>
            <dl className="mt-3 space-y-1 text-sm text-ink-800">
              <div>
                <dt className="inline text-ink-700">Превозвач: </dt>
                <dd className="inline">{order.shippingDetails.method === "box_now" ? "BOX NOW" : "Speedy"}</dd>
              </div>
              <div>
                <dt className="inline text-ink-700">Проследяване №: </dt>
                <dd className="inline">{order.trackingNumber ?? "—"}</dd>
              </div>
              {order.shipmentStatus ? (
                <div>
                  <dt className="inline text-ink-700">Статус: </dt>
                  <dd className="inline">
                    <Badge tone="neutral">{shipmentStatusLabel(order.shipmentStatus)}</Badge>
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.shipmentEvents && order.shipmentEvents.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-lavender-200 pt-3 text-xs text-ink-700">
                {order.shipmentEvents.map((event, index) => (
                  <li key={index}>
                    {new Date(event.occurredAt).toLocaleString("bg-BG")} — {event.event}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Клиент</h2>
            <dl className="mt-3 space-y-1 text-sm text-ink-800">
              <div>
                <dt className="inline text-ink-700">Име: </dt>
                <dd className="inline">{order.customer.fullName}</dd>
              </div>
              <div>
                <dt className="inline text-ink-700">Телефон: </dt>
                <dd className="inline">{order.customer.phone}</dd>
              </div>
              {order.customer.email ? (
                <div>
                  <dt className="inline text-ink-700">Имейл: </dt>
                  <dd className="inline">{order.customer.email}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Адрес за доставка</h2>
            <p className="mt-3 text-sm text-ink-800">{shippingAddressLine(order)}</p>
            {order.giftMessage ? (
              <p className="mt-3 text-sm text-ink-700">
                <span className="text-ink-700">Лично послание: </span>
                {order.giftMessage}
              </p>
            ) : null}
          </section>

          <OrderActionsPanel
            orderId={order.id}
            allowedStatuses={[...allowedTransitions(order.status)]}
            hasTrackingNumber={Boolean(order.trackingNumber)}
          />
        </div>
      </div>
    </div>
  );
}
