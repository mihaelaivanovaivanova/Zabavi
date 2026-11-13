import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { product } from "@/config/site";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";
import { KitEditForm } from "@/components/admin/KitEditForm";

export function generateStaticParams() {
  return product.variants.map((variant) => ({ variantId: variant.id }));
}

export default async function AdminKitEditPage({ params }: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await params;
  const variant = product.variants.find((candidate) => candidate.id === variantId);
  if (!variant) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">{variant.label}</h1>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <KitEditSection variantId={variantId} />
      </Suspense>
    </div>
  );
}

async function KitEditSection({ variantId }: { variantId: string }) {
  await connection();
  const kit = await kitRepository.get(variantId);
  return <KitEditForm variantId={variantId} initialKit={kit} />;
}
