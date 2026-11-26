import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { InputField, TextareaField } from "@/components/ui/Field";
import { PhoneField } from "@/components/checkout/PhoneField";
import { VariantSelector } from "@/components/checkout/VariantSelector";
import type { CheckoutFormValues } from "@/lib/validation";
import type { ProductVariant } from "@/domain/product/types";

export function CustomerInfoStep({
  register,
  errors,
  emailRequired,
  variants,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  emailRequired: boolean;
  variants: ProductVariant[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink-900">Данни за поръчката</h2>

      <VariantSelector variants={variants} register={() => register("variantId")} />

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

      <InputField
        label="Брой кутии"
        type="number"
        min={1}
        max={10}
        {...register("quantity", { valueAsNumber: true })}
        error={errors.quantity?.message}
      />
      <TextareaField label="Лично послание (незадължително)" {...register("giftMessage")} error={errors.giftMessage?.message} />
    </div>
  );
}
