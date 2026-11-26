import type { UseFormRegisterReturn } from "react-hook-form";
import { inputClasses } from "@/components/ui/Field";

/** An inline SVG rather than the 🇧🇬 emoji — Windows doesn't render regional-indicator flag emoji as pictures, just the two letters. */
function BulgarianFlagIcon() {
  return (
    <svg viewBox="0 0 3 2" aria-hidden="true" className="h-4 w-6 shrink-0 rounded-sm">
      <rect width="3" height="2" y="0" fill="#fff" />
      <rect width="3" height="0.667" y="0.667" fill="#00966e" />
      <rect width="3" height="0.667" y="1.333" fill="#d62612" />
    </svg>
  );
}

/**
 * Same BG-flag + "+359" prefix as smisul.bg's own phone field — purely
 * decorative; the underlying input keeps accepting either "0888…" or
 * "+359888…" exactly as `checkoutSchema`'s phone regex already does, so
 * nothing downstream (speedyApiClient, orderEmails, …) needs to change.
 */
export function PhoneField({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={registration.name} className="text-sm font-medium text-ink-800">
        Телефон
      </label>
      <div className="flex items-stretch gap-2">
        <span className={`${inputClasses} flex shrink-0 items-center gap-2 text-ink-700`}>
          <BulgarianFlagIcon />
          +359
        </span>
        <input
          id={registration.name}
          type="tel"
          className={`${inputClasses} flex-1`}
          placeholder="08XXXXXXXX"
          aria-invalid={Boolean(error)}
          {...registration}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
