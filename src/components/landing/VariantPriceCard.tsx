import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { discountPercent, formatBgn } from "@/lib/format";
import type { ProductVariant } from "@/domain/product/types";

export function VariantPriceCard({
  variant,
  priceBgn,
  compareAtPriceBgn,
  active,
  onSelect,
  quantity,
  onQuantityChange,
}: {
  variant: ProductVariant;
  priceBgn: number | null;
  compareAtPriceBgn: number | null;
  active: boolean;
  onSelect: () => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
}) {
  const percentOff = discountPercent(priceBgn, compareAtPriceBgn);

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
          <span className="font-semibold text-ink-900">{variant.label}</span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-lg font-bold text-ink-900">{formatBgn(priceBgn)}</span>
            {compareAtPriceBgn !== null && percentOff !== null ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-sage-700">-{percentOff}%</span>
                <span className="text-xs text-ink-700 line-through">{formatBgn(compareAtPriceBgn)}</span>
              </span>
            ) : null}
          </span>
        </div>

        {active ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-700">Брой кутии</span>
            <QuantityStepper value={quantity} onChange={onQuantityChange} />
          </div>
        ) : null}
      </div>
    </label>
  );
}
