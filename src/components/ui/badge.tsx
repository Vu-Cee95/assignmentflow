import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "accent" | "warm" | "sunny" | "neutral";

const toneClasses: Record<Tone, string> = {
  primary: "bg-calm-blue-light text-calm-blue",
  success: "bg-sage-light text-sage",
  accent: "bg-lavender-light text-lavender",
  warm: "bg-peach-light text-peach",
  sunny: "bg-sunny-light text-sunny",
  neutral: "bg-line/60 text-muted",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
        toneClasses[tone],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}