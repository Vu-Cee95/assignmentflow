import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  tone?: "primary" | "success" | "accent";
  className?: string;
  size?: "sm" | "md";
}

export function Progress({
  value,
  max = 100,
  label,
  tone = "primary",
  className,
  size = "md",
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barTone = {
    primary: "bg-calm-blue",
    success: "bg-sage",
    accent: "bg-lavender",
  }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-calm-blue-light",
            size === "sm" ? "h-1.5" : "h-2.5"
          )}
        >
          <div
            className={cn("h-full rounded-full transition-all", barTone)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-bold text-ink tabular-nums">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}