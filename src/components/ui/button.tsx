import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
type Size = "sm" | "md" | "lg" | "full";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-calm-blue text-white hover:bg-calm-blue/90 focus-visible:outline-calm-blue disabled:bg-calm-blue/40",
  secondary:
    "bg-calm-blue-light text-calm-blue hover:bg-calm-blue-light/70 font-bold",
  outline:
    "border border-line text-ink hover:border-calm-blue hover:text-calm-blue bg-surface",
  ghost: "text-calm-blue hover:bg-calm-blue-light",
  success:
    "bg-sage text-white hover:bg-sage/90 disabled:bg-sage/40",
  danger: "bg-peach text-white hover:bg-peach/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-base rounded-xl gap-2",
  full: "w-full px-5 py-3.5 text-base rounded-xl gap-2 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center font-semibold transition-colors cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export function Spinner() {
  return (
    <svg
      className="size-4 animate-spin shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}