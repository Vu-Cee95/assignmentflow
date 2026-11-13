import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
  progress?: number; // 0–1 within current step
}

export function Stepper({ steps, current, progress = 0 }: StepperProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const fraction = done ? 1 : active ? Math.min(1, Math.max(0, progress)) : 0;
        return (
          <li key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <span
              aria-current={active ? "step" : undefined}
              aria-label={step}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                done && "bg-calm-blue text-white",
                active && "bg-calm-blue-light text-calm-blue ring-2 ring-calm-blue",
                !done && !active && "bg-line/60 text-muted"
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="relative h-0.5 flex-1 rounded bg-line">
                <span
                  className={cn("absolute inset-y-0 left-0 rounded bg-calm-blue transition-all duration-300")}
                  style={{ width: `${fraction * 100}%` }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}