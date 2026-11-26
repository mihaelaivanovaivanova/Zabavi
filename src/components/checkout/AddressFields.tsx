import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { InputField } from "@/components/ui/Field";
import { SettlementPicker } from "@/components/checkout/SettlementPicker";
import type { CheckoutFormValues } from "@/lib/validation";

export function AddressFields({
  register,
  errors,
  watch,
  setValue,
  title,
  addressLabel = "Адрес",
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  title?: string;
  addressLabel?: string;
}) {
  const city = watch("city") ?? "";

  return (
    <div className="space-y-4">
      {title ? <h2 className="text-lg font-semibold text-ink-900">{title}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <SettlementPicker
          value={city}
          onSelect={(selection) => {
            setValue("city", selection.label, { shouldValidate: true });
            // Not shown as its own field — derived from the chosen
            // settlement and carried along silently, same data the old
            // visible "Пощенски код" field used to capture directly.
            setValue("postalCode", selection.postalCode, { shouldValidate: true });
          }}
          error={errors.city?.message}
        />
        <InputField label={addressLabel} {...register("address")} error={errors.address?.message} />
      </div>
    </div>
  );
}
