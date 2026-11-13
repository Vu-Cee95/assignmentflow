import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-0 z-50 ml-2 whitespace-nowrap px-1 text-[11px] font-medium text-calm-blue opacity-0 transition-opacity duration-150 group-hover:opacity-80",
          "bottom-full mb-1"
        )}
      >
        {label}
      </span>
    </span>
  );
}