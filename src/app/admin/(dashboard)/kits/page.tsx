import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { product } from "@/config/site";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";
import { formatBgn } from "@/lib/format";

export default function AdminKitsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Комплекти</h1>
      <p className="mt-2 text-sm text-ink-700">
        Всеки комплект е отделен вариант на „{product.name}“ — цената и снимките се настройват поотделно за всеки.
      </p>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <KitsGrid />
      </Suspense>
    </div>
  );
}

async function KitsGrid() {
  await connection();
  const kits = await kitRepository.getMany(product.variants.map((variant) => variant.id));
  const kitsById = new Map(kits.map((kit) => [kit.variantId, kit]));

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {product.variants.map((variant) => {
        const kit = kitsById.get(variant.id);
        return (
          <Link
            key={variant.id}
            href={`/admin/kits/${variant.id}`}
            className="block overflow-hidden rounded-2xl border border-lavender-200 bg-paper-50 transition-colors hover:border-burgundy-400"
          >
            <div className="flex aspect-square items-center justify-center border-b border-lavender-200 bg-lavender-50">
              {kit?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
                <img src={kit.coverImage.url} alt={kit.coverImage.alt} className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-sm font-medium text-lavender-600">Няма заглавна снимка</span>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-ink-900">{variant.label}</h2>
              <p className="mt-1 text-sm text-ink-700">
                {kit?.compareAtPriceBgn ? (
                  <span className="mr-2 line-through">{formatBgn(kit.compareAtPriceBgn)}</span>
                ) : null}
                {formatBgn(kit?.priceBgn ?? null)}
              </p>
              <p className="mt-1 text-xs text-ink-700">{kit?.gallery.length ?? 0} снимки в галерията</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
