import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink mb-1.5">
        {label}
        {required && <span className="text-peach" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-peach">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid, className, ...rest }: TextInputProps) {
  const id = useId();
  rest.id = rest.id ?? id;
  return (
    <input
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-muted/70 focus:border-calm-blue",
        invalid && "border-peach",
        className
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({
  children,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}