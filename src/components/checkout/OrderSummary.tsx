import { Badge } from "@/components/ui/Badge";
import { formatBgn } from "@/lib/format";
import { product } from "@/config/site";

export function OrderSummary({ quantity }: { quantity: number }) {
  return (
    <div className="rounded-2xl border border-lavender-200 bg-lavender-50 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Обобщение на поръчката</h2>
        <Badge>Демо</Badge>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-ink-800">
        <div className="flex justify-between">
          <dt>{product.name}</dt>
          <dd>× {quantity}</dd>
        </div>
        <div className="flex justify-between border-t border-lavender-200 pt-2 font-semibold">
          <dt>Крайна сума</dt>
          <dd>{formatBgn(product.priceBgn)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-ink-700">
        Това е демонстрационен изглед. Цената е все още TBD и не се подава реална поръчка.
      </p>
    </div>
  );
}
