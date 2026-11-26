import { deliveryMethods, paymentMethods } from "@/config/site";
import type { CheckoutFormValues } from "@/lib/validation";

function deliveryAddressLine(values: CheckoutFormValues): string {
  switch (values.deliveryMethod) {
    case "courier":
      return `${values.address}, ${values.city} ${values.postalCode}`;
    case "box_now":
      return `BOX NOW автомат — ${values.boxNowLockerAddressLine1}, ${values.boxNowLockerPostalCode}`;
    case "speedy_office":
    case "speedy_locker":
      return values.speedyOfficeLabel ?? "";
  }
}

export function OrderReviewStep({
  values,
  variantLabel,
}: {
  values: CheckoutFormValues;
  variantLabel?: string;
}) {
  const deliveryLabel = deliveryMethods.find((method) => method.id === values.deliveryMethod)?.label ?? values.deliveryMethod;
  const paymentLabel = paymentMethods.find((method) => method.id === values.paymentMethod)?.label ?? values.paymentMethod;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink-900">Преглед на поръчката</h2>

      <dl className="space-y-3 text-sm text-ink-800">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-700">Комплект</dt>
          <dd className="text-right">
            {variantLabel} × {values.quantity}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-700">Получател</dt>
          <dd className="text-right">
            {values.firstName} {values.lastName}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-700">Телефон</dt>
          <dd className="text-right">{values.phone}</dd>
        </div>
        {values.email ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Имейл</dt>
            <dd className="text-right">{values.email}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-700">Доставка</dt>
          <dd className="text-right">
            {deliveryLabel}
            <span className="block text-ink-700">{deliveryAddressLine(values)}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-700">Плащане</dt>
          <dd className="text-right">{paymentLabel}</dd>
        </div>
        {values.wantsInvoice ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Фактура</dt>
            <dd className="text-right">Да</dd>
          </div>
        ) : null}
        {values.giftMessage ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Лично послание</dt>
            <dd className="text-right">{values.giftMessage}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
