import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-800">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClasses =
  "rounded-lg border border-lavender-200 bg-paper-50 px-4 py-2.5 text-ink-900 outline-none transition-colors focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-200 aria-[invalid=true]:border-burgundy-500";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function InputField({ label, error, id, ...props }: InputFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id ?? props.name ?? label} error={error}>
      <input
        id={id ?? props.name ?? label}
        className={inputClasses}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldWrapper>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextareaField({ label, error, id, ...props }: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id ?? props.name ?? label} error={error}>
      <textarea
        id={id ?? props.name ?? label}
        className={inputClasses}
        aria-invalid={Boolean(error)}
        rows={3}
        {...props}
      />
    </FieldWrapper>
  );
}
