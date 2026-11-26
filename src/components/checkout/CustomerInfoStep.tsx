import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { InputField } from "@/components/ui/Field";
import { PhoneField } from "@/components/checkout/PhoneField";
import type { CheckoutFormValues } from "@/lib/validation";

export function CustomerInfoStep({
  register,
  errors,
  emailRequired,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  emailRequired: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink-900">Данни за поръчката</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Име" {...register("firstName")} error={errors.firstName?.message} />
        <InputField label="Фамилия" {...register("lastName")} error={errors.lastName?.message} />
      </div>
      <PhoneField registration={register("phone")} error={errors.phone?.message} />
      <InputField
        label={emailRequired ? "Имейл" : "Имейл (незадължително)"}
        type="email"
        {...register("email")}
        error={errors.email?.message}
      />
    </div>
  );
}
