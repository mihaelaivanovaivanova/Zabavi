import type { UseFormRegisterReturn } from "react-hook-form";
import { Badge } from "@/components/ui/Badge";
import { paymentMethods } from "@/config/site";

export function PaymentMethodSelector({ register }: { register: () => UseFormRegisterReturn }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink-800">Начин на плащане</legend>
      {paymentMethods.map((method) => (
        <label
          key={method.id}
          className="flex items-start gap-3 rounded-xl border border-lavender-200 bg-paper-50 px-4 py-3 cursor-pointer"
        >
          <input type="radio" value={method.id} className="mt-1" {...register()} />
          <span>
            <span className="flex items-center gap-2 font-medium text-ink-900">
              {method.label}
              {method.isDemo ? <Badge>Демо</Badge> : null}
            </span>
            <span className="block text-sm text-ink-700">{method.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
