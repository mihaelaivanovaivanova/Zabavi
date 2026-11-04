import type { UseFormRegisterReturn } from "react-hook-form";
import { deliveryMethods } from "@/config/site";

export function DeliveryMethodSelector({ register }: { register: () => UseFormRegisterReturn }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink-800">Начин на доставка</legend>
      {deliveryMethods.map((method) => (
        <label
          key={method.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            method.available
              ? "border-lavender-200 bg-paper-50 cursor-pointer"
              : "border-lavender-100 bg-paper-200/60 text-ink-700/60 cursor-not-allowed"
          }`}
        >
          <input
            type="radio"
            value={method.id}
            disabled={!method.available}
            className="mt-1"
            {...register()}
          />
          <span>
            <span className="block font-medium text-ink-900">
              {method.label}
              {!method.available ? " (очаквайте скоро)" : null}
            </span>
            <span className="block text-sm text-ink-700">{method.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
