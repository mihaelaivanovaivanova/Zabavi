"use client";

import Link from "next/link";
import { PaymentBadges } from "@/components/landing/PaymentBadges";
import { LinkButton } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { product } from "@/config/site";
import { resolveVariant } from "@/domain/kit/types";
import { useCart } from "@/lib/CartContext";
import { formatEur } from "@/lib/format";
import { useKits } from "@/lib/useKits";

export function CartDrawer() {
  const { item, isOpen, closeCart, addToCart, clearCart } = useCart();
  const { kits } = useKits();

  const kit = item ? kits.find((k) => k.variantId === item.variantId) : undefined;
  const configVariant = item ? product.variants.find((v) => v.id === item.variantId) : undefined;
  const variant = configVariant ? resolveVariant(configVariant, kit) : undefined;
  const priceEur = kit?.priceEur ?? null;
  const totalEur = item && priceEur !== null ? priceEur * item.quantity : null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-ink-900/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Количка"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-paper-50 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-lavender-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-ink-900">Количка</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Затвори количката"
            className="text-2xl leading-none text-ink-700 hover:text-ink-900"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {item && variant ? (
            <div className="flex gap-3 border-b border-lavender-200 pb-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                {kit?.coverImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
                  <img
                    src={kit.coverImage.url}
                    alt={kit.coverImage.alt}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${kit.coverImage.focalX ?? 50}% ${kit.coverImage.focalY ?? 50}%` }}
                  />
                ) : (
                  <PlaceholderImage label="" alt="" aspect="square" className="h-full w-full rounded-lg" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">{product.name}</p>
                    <p className="text-sm text-ink-700">{variant.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    aria-label="Премахни от количката"
                    className="shrink-0 text-ink-500 hover:text-burgundy-700"
                  >
                    🗑
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper value={item.quantity} onChange={(next) => addToCart(item.variantId, next)} />
                  <span className="font-semibold text-ink-900">
                    {priceEur !== null ? formatEur(priceEur * item.quantity) : formatEur(null)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-ink-700">Количката е празна.</p>
          )}
        </div>

        {item ? (
          <div className="border-t border-lavender-200 px-5 py-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-ink-900">Общо</span>
              <span className="font-bold text-ink-900">{formatEur(totalEur)}</span>
            </div>
            <LinkButton href="/checkout" variant="primary" className="mt-4 w-full" onClick={closeCart}>
              Продължи към плащане
            </LinkButton>
            <div className="mt-4">
              <PaymentBadges />
            </div>
          </div>
        ) : (
          <div className="border-t border-lavender-200 px-5 py-4">
            <Link
              href="/"
              onClick={closeCart}
              className="block text-center text-sm font-semibold text-burgundy-700 hover:underline"
            >
              Разгледай комплектите
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
