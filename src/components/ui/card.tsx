import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "accent";
}

const toneClasses = {
  default: "bg-surface border-line",
  primary: "bg-calm-blue-light/60 border-calm-blue/30",
  success: "bg-sage-light/60 border-sage/30",
  accent: "bg-lavender-light/60 border-lavender/30",
};

export function Card({ children, tone = "default", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm p-5",
        toneClasses[tone],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>{children}</div>;
}

export function CardTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <h2 id={id} className={cn("text-base font-bold text-ink", className)}>{children}</h2>;
}