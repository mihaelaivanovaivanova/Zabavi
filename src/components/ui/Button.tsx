import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-burgundy-700 text-paper-50 hover:bg-burgundy-600 focus-visible:outline-burgundy-700",
  secondary:
    "bg-lavender-100 text-burgundy-800 hover:bg-lavender-200 focus-visible:outline-lavender-600",
  ghost:
    "bg-transparent text-burgundy-700 underline underline-offset-4 hover:text-burgundy-600",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} />;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
}

export function LinkButton({ variant = "primary", className = "", children, ...props }: LinkButtonProps) {
  return (
    <a className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </a>
  );
}
