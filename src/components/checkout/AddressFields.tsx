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
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  title?: string;
}) {
  const city = watch("city") ?? "";

  return (
    <div className="space-y-4">
      {title ? <h2 className="text-lg font-semibold text-ink-900">{title}</h2> : null}
      <InputField label="Адрес" {...register("address")} error={errors.address?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettlementPicker
          value={city}
          onSelect={(selection) => {
            setValue("city", selection.label, { shouldValidate: true });
            setValue("postalCode", selection.postalCode, { shouldValidate: true });
          }}
          error={errors.city?.message}
        />
        <InputField label="Пощенски код" {...register("postalCode")} error={errors.postalCode?.message} />
      </div>
    </div>
  );
}
