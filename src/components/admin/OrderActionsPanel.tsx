"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/domain/order/types";
import { Button } from "@/components/ui/Button";
import { TextareaField, inputClasses } from "@/components/ui/Field";

type ActionState = { status: "idle" } | { status: "working" } | { status: "error"; message: string };

const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Очаква плащане",
  paid: "Платена",
  confirmed: "Потвърдена",
  packed: "Опакована",
  shipped: "Изпратена",
  delivered: "Доставена",
  returned: "Върната",
  cancelled: "Отказана",
  refunded: "Възстановена",
  failed: "Неуспешна",
};

export function OrderActionsPanel({
  orderId,
  allowedStatuses,
  hasTrackingNumber,
}: {
  orderId: string;
  allowedStatuses: OrderStatus[];
  hasTrackingNumber: boolean;
}) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [statusState, setStatusState] = useState<ActionState>({ status: "idle" });
  const [shipmentState, setShipmentState] = useState<ActionState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<ActionState>({ status: "idle" });

  async function handleStatusUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!newStatus) return;
    setStatusState({ status: "working" });

    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatusState({ status: "error", message: data.error ?? "Промяната на статуса се провали." });
      return;
    }

    setStatusState({ status: "idle" });
    setNewStatus("");
    setNote("");
    router.refresh();
  }

  async function handleCreateShipment() {
    setShipmentState({ status: "working" });

    const response = await fetch(`/api/admin/orders/${orderId}/shipment/create`, { method: "POST" });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setShipmentState({ status: "error", message: data.error ?? "Заявяването на пратката се провали." });
      return;
    }

    setShipmentState({ status: "idle" });
    router.refresh();
  }

  async function handleCancelShipment() {
    if (!confirm("Сигурен ли си, че искаш да анулираш пратката при превозвача?")) return;
    setShipmentState({ status: "working" });

    const response = await fetch(`/api/admin/orders/${orderId}/shipment/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setShipmentState({ status: "error", message: data.error ?? "Анулирането на пратката се провали." });
      return;
    }

    setShipmentState({ status: "idle" });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Това ще изтрие поръчката завинаги, заедно с историята ѝ. Не може да бъде отменено. Продължи?")) {
      return;
    }
    setDeleteState({ status: "working" });

    const response = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setDeleteState({ status: "error", message: data.error ?? "Изтриването се провали." });
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
        <h2 className="text-lg font-semibold text-ink-900">Промяна на статус</h2>
        <form onSubmit={handleStatusUpdate} className="mt-3 space-y-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            className={inputClasses}
          >
            <option value="">Избери нов статус…</option>
            {allowedStatuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <TextareaField label="Бележка (незадължително)" value={note} onChange={(e) => setNote(e.target.value)} />
          {statusState.status === "error" ? (
            <p role="alert" className="text-sm text-burgundy-600">
              {statusState.message}
            </p>
          ) : null}
          <Button type="submit" disabled={!newStatus || statusState.status === "working"}>
            {statusState.status === "working" ? "Запазване…" : "Промени статуса"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
        <h2 className="text-lg font-semibold text-ink-900">Пратка</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {hasTrackingNumber ? (
            <>
              <a href={`/api/admin/orders/${orderId}/shipment/label`} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  Изтегли етикет
                </Button>
              </a>
              <Button type="button" variant="secondary" onClick={handleCancelShipment} disabled={shipmentState.status === "working"}>
                {shipmentState.status === "working" ? "Анулиране…" : "Анулирай пратката"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" onClick={handleCreateShipment} disabled={shipmentState.status === "working"}>
              {shipmentState.status === "working" ? "Заявяване…" : "Създай пратка"}
            </Button>
          )}
        </div>
        {!hasTrackingNumber ? (
          <p className="mt-2 text-sm text-ink-700">
            Няма заявена пратка — автоматичното заявяване при потвърждение на поръчката е неуспяло (вижте грешката по-долу
            при опит) или е пропуснато. Натисни „Създай пратка“, за да опиташ отново.
          </p>
        ) : null}
        {shipmentState.status === "error" ? (
          <p role="alert" className="mt-2 text-sm text-burgundy-600">
            {shipmentState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-burgundy-300 bg-paper-50 p-6">
        <h2 className="text-lg font-semibold text-burgundy-700">Изтрий поръчката</h2>
        <p className="mt-2 text-sm text-ink-700">
          Изтрива поръчката завинаги, заедно с артикулите, плащанията и историята ѝ. Ако има създадена пратка, която
          още не е в краен статус, тя първо се анулира при превозвача. Не може да бъде отменено.
        </p>
        {deleteState.status === "error" ? (
          <p role="alert" className="mt-2 text-sm text-burgundy-600">
            {deleteState.message}
          </p>
        ) : null}
        <Button type="button" variant="secondary" onClick={handleDelete} disabled={deleteState.status === "working"} className="mt-3">
          {deleteState.status === "working" ? "Изтриване…" : "Изтрий поръчката"}
        </Button>
      </section>
    </div>
  );
}
