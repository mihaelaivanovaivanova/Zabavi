import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { InputField } from "@/components/ui/Field";
import type { CheckoutFormValues } from "@/lib/validation";

export function AddressFields({
  register,
  errors,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
}) {
  return (
    <div className="space-y-4">
      <InputField label="Адрес" {...register("address")} error={errors.address?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Град" {...register("city")} error={errors.city?.message} />
        <InputField label="Пощенски код" {...register("postalCode")} error={errors.postalCode?.message} />
      </div>
    </div>
  );
}
