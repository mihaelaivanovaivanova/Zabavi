import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { discountPercent, formatEur } from "@/lib/format";
import type { ProductVariant } from "@/domain/product/types";

export function VariantPriceCard({
  variant,
  priceEur,
  compareAtPriceEur,
  active,
  onSelect,
  quantity,
  onQuantityChange,
}: {
  variant: ProductVariant;
  priceEur: number | null;
  compareAtPriceEur: number | null;
  active: boolean;
  onSelect: () => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
}) {
  const percentOff = discountPercent(priceEur, compareAtPriceEur);

  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
        active ? "border-burgundy-700 bg-paper-50" : "border-lavender-200 bg-paper-50/60 hover:border-lavender-300"
      }`}
    >
      <input
        type="radio"
        name="hero-variant"
        className="mt-1 h-4 w-4 accent-burgundy-700"
        checked={active}
        onChange={onSelect}
      />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-1">
            <span className="text-lg font-semibold text-ink-900">{variant.label}</span>
            {percentOff !== null ? (
              <span className="-ml-0.5 -mt-1.5 inline-flex items-center rounded-full bg-burgundy-700 px-2 py-0.5 text-xs font-bold text-paper-50">
                -{percentOff}%
              </span>
            ) : null}
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="whitespace-nowrap text-2xl font-bold text-ink-900">{formatEur(priceEur)}</span>
            {compareAtPriceEur !== null && percentOff !== null ? (
              <span className="text-sm text-ink-700 line-through">{formatEur(compareAtPriceEur)}</span>
            ) : null}
          </span>
        </div>

        {active && variant.contents && variant.contents.length > 0 ? (
          <div className="mt-4">
            {variant.intro ? <p className="text-sm text-ink-700">{variant.intro}</p> : null}
            <p className={`text-sm font-semibold text-ink-900 ${variant.intro ? "mt-2" : ""}`}>Получаваш:</p>
            <ul className="mt-2 space-y-1.5">
              {variant.contents.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink-700">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {active && variant.bonus && variant.bonus.length > 0 ? (
          <div className="relative mt-4 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative torn-paper background, not a content photo */}
            <img
              src="/images/bonus-banner.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-fill"
            />
            <div className="relative">
              <p className="text-sm font-semibold text-ink-900">Бонус:</p>
              <ul className="mt-2 space-y-1.5">
                {variant.bonus.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-ink-700">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {active ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-700">Брой кутии</span>
            <QuantityStepper value={quantity} onChange={onQuantityChange} />
          </div>
        ) : null}
      </div>
    </label>
  );
}
