import { Suspense } from "react";
import { connection } from "next/server";
import { orderRepository } from "@/infrastructure/repositories/orderRepository";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Поръчки</h1>
      <p className="mt-2 text-sm text-ink-700">
        {process.env.DATABASE_URL
          ? "Поръчките се пазят в реална база данни (Postgres)."
          : "Демо хранилище в паметта на сървъра — списъкът се изчиства при всеки рестарт, не е реална база данни."}
      </p>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <OrdersSection />
      </Suspense>
    </div>
  );
}

async function OrdersSection() {
  // In-memory repo read has no request-time signal of its own — opt out of
  // the static shell so every request sees the current order list, not a
  // build-time snapshot.
  await connection();
  const orders = await orderRepository.findAll();

  return <AdminDashboard orders={orders} />;
}
