import { formatEur } from "@/lib/format";
import { product } from "@/config/site";
import type { DeliveryMethodId } from "@/domain/shipping/types";
import type { ShippingPrices } from "@/infrastructure/settings/shippingPricesService";

export function CheckoutSummary({
  quantity,
  variantLabel,
  priceEur,
  deliveryMethod,
  isCashOnDelivery,
  shippingPrices,
  codFeeEur,
  isShippingKnown,
}: {
  quantity: number;
  variantLabel?: string;
  priceEur: number | null;
  deliveryMethod: DeliveryMethodId;
  isCashOnDelivery: boolean;
  shippingPrices: ShippingPrices | null;
  codFeeEur: number;
  /** False on step 1, before the person has reached the delivery step — the shipping price depends on the method they haven't chosen yet, so it isn't shown or added to the total as "free". */
  isShippingKnown: boolean;
}) {
  const subtotalEur = priceEur !== null ? priceEur * quantity : null;
  const shippingEur = shippingPrices?.[deliveryMethod] ?? 0;
  const resolvedCodFeeEur = isCashOnDelivery ? codFeeEur : 0;
  const totalEur =
    subtotalEur !== null ? subtotalEur + (isShippingKnown ? shippingEur : 0) + resolvedCodFeeEur : null;

  return (
    <div className="rounded-2xl border border-lavender-200 bg-lavender-50 p-6">
      <h2 className="text-lg font-semibold text-ink-900">Обобщение на поръчката</h2>
      <dl className="mt-4 space-y-2 text-sm text-ink-800">
        <div className="flex justify-between">
          <dt>
            {product.name}
            {variantLabel ? <span className="block text-xs text-ink-700">{variantLabel}</span> : null}
          </dt>
          <dd>× {quantity}</dd>
        </div>
        <div className="flex justify-between border-t border-lavender-200 pt-2">
          <dt>Междинна сума</dt>
          <dd>{formatEur(subtotalEur)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Доставка</dt>
          <dd>
            {!isShippingKnown ? "Изчислява се на следващата стъпка" : shippingEur > 0 ? formatEur(shippingEur) : "Безплатна"}
          </dd>
        </div>
        {resolvedCodFeeEur > 0 ? (
          <div className="flex justify-between">
            <dt>Наложен платеж</dt>
            <dd>{formatEur(resolvedCodFeeEur)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>Отстъпка</dt>
          <dd>{formatEur(0)}</dd>
        </div>
        <div className="flex justify-between border-t border-lavender-200 pt-2 font-semibold">
          <dt>Крайна сума</dt>
          <dd>{formatEur(totalEur)}</dd>
        </div>
      </dl>
    </div>
  );
}
