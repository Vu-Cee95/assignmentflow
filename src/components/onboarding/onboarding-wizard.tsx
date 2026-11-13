"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Mountain, Footprints, Puzzle } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Screen {
  id: "mountain" | "steps" | "puzzle";
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  accent: string;
  chip: string;
}

const SCREENS: Screen[] = [
  {
    id: "mountain",
    icon: Mountain,
    title: "The mountain isn't climbed by staring at it.",
    body: "Big assignments feel impossible when you look at them whole. But every POE is really just a line of small, climbable steps.",
    cta: "Next",
    accent: "bg-calm-blue-light text-calm-blue",
    chip: "1 of 3",
  },
  {
    id: "steps",
    icon: Footprints,
    title: "Small, steady steps become something amazing over time.",
    body: "One question, one page, one gentle session at a time. Consistency quietly does the heavy lifting — momentum does the rest.",
    cta: "Next",
    accent: "bg-sage-light text-sage",
    chip: "2 of 3",
  },
  {
    id: "puzzle",
    icon: Puzzle,
    title: "We break your assignments into small, daily, doable steps.",
    body: "That's AssignmentFlow. You bring the work, we keep it bite-sized — and none of it ever has to happen all at once.",
    cta: "Get Started",
    accent: "bg-peach-light text-peach",
    chip: "3 of 3",
  },
];

export function OnboardingWizard() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const screen = SCREENS[index]!;

  const finish = () => {
    dispatch({ type: "COMPLETE_ONBOARDING" });
    router.replace("/dashboard");
  };

  const advance = () => {
    if (index < SCREENS.length - 1) setIndex(index + 1);
    else finish();
  };

  const Icon = screen.icon;

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className={cn("mx-auto grid size-24 place-items-center rounded-3xl", screen.accent)}>
        <Icon className="size-12" aria-hidden="true" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={SCREENS.length} aria-valuenow={index + 1} aria-label="Onboarding step">
        {SCREENS.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-8 bg-calm-blue" : "w-3 bg-line"
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{screen.chip}</p>
        <h1 className="mx-auto mt-2 max-w-sm text-2xl font-extrabold leading-snug text-ink">
          {screen.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{screen.body}</p>
      </div>

      <div className="mt-10 space-y-3">
        <Button size="full" onClick={advance}>{screen.cta}</Button>
        <button
          type="button"
          onClick={finish}
          className="mx-auto block text-sm font-semibold text-muted cursor-pointer"
        >
          {index < SCREENS.length - 1 ? "Skip for now" : "I'll set this up later"}
        </button>
      </div>
    </div>
  );
}