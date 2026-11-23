import type { UseFormRegisterReturn } from "react-hook-form";
import type { ProductVariant } from "@/domain/product/types";

export function VariantSelector({
  variants,
  register,
}: {
  variants: ProductVariant[];
  register: () => UseFormRegisterReturn;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink-800">Тема на комплекта</legend>
      {variants.map((variant) => (
        <label
          key={variant.id}
          className="flex items-start gap-3 rounded-xl border border-lavender-200 bg-paper-50 px-4 py-3 cursor-pointer"
        >
          <input type="radio" value={variant.id} className="mt-1" {...register()} />
          <span className="font-medium text-ink-900">{variant.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
