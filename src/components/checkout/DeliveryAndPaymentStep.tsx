import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Badge } from "@/components/ui/Badge";
import { AddressFields } from "@/components/checkout/AddressFields";
import { BoxNowLockerPicker, type BoxNowSelection } from "@/components/checkout/BoxNowLockerPicker";
import { SpeedyOfficePicker } from "@/components/checkout/SpeedyOfficePicker";
import { deliveryMethods, paymentMethods } from "@/config/site";
import { formatEur } from "@/lib/format";
import type { CheckoutFormValues } from "@/lib/validation";
import type { ShippingPrices } from "@/infrastructure/settings/shippingPricesService";

export function DeliveryAndPaymentStep({
  register,
  errors,
  watch,
  setValue,
  codFeeEur,
  shippingPrices,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  codFeeEur: number;
  shippingPrices: ShippingPrices | null;
}) {
  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const boxNowLockerId = watch("boxNowLockerId");
  const boxNowLockerAddressLine1 = watch("boxNowLockerAddressLine1");
  const boxNowLockerPostalCode = watch("boxNowLockerPostalCode");
  const speedyOfficeId = watch("speedyOfficeId");
  const speedyOfficeLabel = watch("speedyOfficeLabel");
  const speedyOfficeCity = watch("speedyOfficeCity");

  function handleLockerSelect(selection: BoxNowSelection | null) {
    setValue("boxNowLockerId", selection?.lockerId ?? "", { shouldValidate: true });
    setValue("boxNowLockerAddressLine1", selection?.addressLine1 ?? "");
    setValue("boxNowLockerPostalCode", selection?.postalCode ?? "");
  }

  function handleSpeedyOfficeSelect(selection: { officeId: string; officeLabel: string; city: string } | null) {
    setValue("speedyOfficeId", selection?.officeId ?? "", { shouldValidate: true });
    setValue("speedyOfficeLabel", selection?.officeLabel ?? "");
    setValue("speedyOfficeCity", selection?.city ?? "");
  }

  const paymentRegistration = register("paymentMethod");

  function handlePaymentMethodChange(nextPaymentMethod: string) {
    // BOX NOW's locker network has no courier at the door to collect cash,
    // so it can't pair with cash on delivery — move off it automatically
    // instead of leaving the form in a combination its own validation would
    // reject (same approach smisul.bg's checkout uses).
    if (nextPaymentMethod === "cash_on_delivery" && deliveryMethod === "box_now") {
      const fallback = deliveryMethods.find((method) => method.available && method.id !== "box_now");
      if (fallback) {
        setValue("deliveryMethod", fallback.id, { shouldValidate: true });
        setValue("boxNowLockerId", "");
        setValue("boxNowLockerAddressLine1", "");
        setValue("boxNowLockerPostalCode", "");
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Начин на плащане</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Начин на плащане</legend>
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className="flex items-start gap-3 rounded-xl border border-lavender-200 bg-paper-50 px-4 py-3 cursor-pointer"
            >
              <input
                type="radio"
                value={method.id}
                className="mt-1"
                {...paymentRegistration}
                onChange={(event) => {
                  paymentRegistration.onChange(event);
                  handlePaymentMethodChange(event.target.value);
                }}
              />
              <span>
                <span className="flex items-center gap-2 font-medium text-ink-900">
                  {method.label}
                  {method.id === "cash_on_delivery" && codFeeEur > 0 ? <Badge tone="neutral">+{codFeeEur.toFixed(2)} €</Badge> : null}
                </span>
                <span className="block text-sm text-ink-700">{method.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {errors.paymentMethod?.message ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {errors.paymentMethod.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Начин на доставка</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Начин на доставка</legend>
          {deliveryMethods.map((method) => {
            const priceEur = shippingPrices?.[method.id] ?? 0;
            // BOX NOW has no courier at the door to collect cash, so it
            // can't be chosen while cash on delivery is the payment method.
            const isCodBlocked = method.id === "box_now" && paymentMethod === "cash_on_delivery";
            const isDisabled = !method.available || isCodBlocked;
            return (
            <div
              key={method.id}
              className={`rounded-xl border px-4 py-3 ${
                isDisabled ? "border-lavender-100 bg-paper-200/60" : "border-lavender-200 bg-paper-50"
              }`}
            >
              <label className={`flex items-center gap-3 ${isDisabled ? "cursor-not-allowed text-ink-700/60" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  value={method.id}
                  disabled={isDisabled}
                  className="shrink-0"
                  {...register("deliveryMethod")}
                />
                <span className="flex h-8 w-12 shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- real carrier logos, not an optimized remote image */}
                  <img src={method.logo.src} alt={method.logo.alt} className="max-h-full max-w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink-900">
                    {method.label}
                    {!method.available ? " (очаквайте скоро)" : null}
                  </span>
                  <span className="block text-sm text-ink-700">
                    {isCodBlocked ? "Не е наличен при наложен платеж." : method.description}
                  </span>
                  {method.available && !isCodBlocked ? (
                    <span className="block text-sm text-ink-700">Очаквана доставка: {method.estimatedDays}</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-semibold text-ink-900">{formatEur(priceEur)}</span>
              </label>

              {deliveryMethod === method.id ? (
                <div className="mt-4 border-t border-lavender-200 pt-4">
                  {method.id === "box_now" ? (
                    <BoxNowLockerPicker
                      selected={
                        boxNowLockerId
                          ? {
                              lockerId: boxNowLockerId,
                              addressLine1: boxNowLockerAddressLine1 ?? "",
                              postalCode: boxNowLockerPostalCode ?? "",
                            }
                          : null
                      }
                      onSelect={handleLockerSelect}
                      error={errors.boxNowLockerId?.message}
                    />
                  ) : method.id === "speedy_office" || method.id === "speedy_locker" ? (
                    <SpeedyOfficePicker
                      type={method.id === "speedy_office" ? "office" : "locker"}
                      selected={speedyOfficeId ? { officeId: speedyOfficeId, officeLabel: speedyOfficeLabel ?? "", city: speedyOfficeCity ?? "" } : null}
                      onSelect={handleSpeedyOfficeSelect}
                      error={errors.speedyOfficeId?.message}
                    />
                  ) : (
                    <AddressFields
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                      addressLabel="Адрес за доставка"
                    />
                  )}
                </div>
              ) : null}
            </div>
            );
          })}
        </fieldset>
      </div>

      {deliveryMethod === "box_now" && paymentMethod === "card_icard" ? (
        <AddressFields register={register} errors={errors} watch={watch} setValue={setValue} title="Адрес за фактуриране" />
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border border-lavender-200 bg-paper-50 px-4 py-3 cursor-pointer">
        <input type="checkbox" className="mt-1" {...register("wantsInvoice")} />
        <span>
          <span className="block font-medium text-ink-900">Искам фактура</span>
          <span className="block text-sm text-ink-700">Ще получиш фактура на имейла си след потвърждение на поръчката.</span>
        </span>
      </label>
    </div>
  );
}
