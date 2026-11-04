import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { InputField } from "@/components/ui/Field";
import type { CheckoutFormValues } from "@/lib/validation";

export function AddressFields({
  register,
  errors,
  title,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  title?: string;
}) {
  return (
    <div className="space-y-4">
      {title ? <h2 className="text-lg font-semibold text-ink-900">{title}</h2> : null}
      <InputField label="Адрес" {...register("address")} error={errors.address?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Град" {...register("city")} error={errors.city?.message} />
        <InputField label="Пощенски код" {...register("postalCode")} error={errors.postalCode?.message} />
      </div>
    </div>
  );
}
