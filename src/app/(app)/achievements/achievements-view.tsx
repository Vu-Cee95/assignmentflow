"use client";

import { useMemo } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { ACHIEVEMENTS, derivedAchievements } from "@/lib/data/mock";
import { dailyStreak } from "@/lib/domain/state";
import type { AchievementId } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function AchievementsView() {
  const { state } = useApp();

  const unlocked = useMemo(() => {
    const base: AchievementId[] = state.user?.achievements ?? [];
    return derivedAchievements(
      {
        streak: dailyStreak(state),
        targetsCompleted: state.dailyTargets.filter((d) => d.status === "completed").length,
        assignments: state.assignments.length,
        references: state.references.length,
        rewards: state.redeemedRewardIds.length,
        supportPosted: state.supportMessages.length > 0,
      },
      base
    );
  }, [state]);

  const count = unlocked.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Achievements</h1>
        <p className="text-sm text-muted">
          Gold stars for showing up — not for overworking.
        </p>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-3 !p-4">
        <p className="text-sm font-semibold text-ink">
          <strong className="text-calm-blue">{count}</strong> of {ACHIEVEMENTS.length} unlocked
        </p>
        <p className="text-xs text-muted">+{ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).reduce((sum, a) => sum + a.xp, 0)} XP from badges</p>
      </Card>

      <section aria-label="Achievement badge collection" className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <Card
              key={a.id}
              className={cn(
                "flex items-start gap-3",
                isUnlocked ? "!border-sage/40" : "!bg-canvas/60 !border-line"
              )}
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-2xl text-xl",
                  isUnlocked ? "bg-sage-light" : "bg-line/40 grayscale"
                )}
                aria-hidden="true"
              >
                {isUnlocked ? a.icon : <Lock className="size-5 text-muted" />}
              </span>
              <div className="flex-1">
                <p className={cn("font-bold", isUnlocked ? "text-ink" : "text-muted")}>{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.description}</p>
                <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-bold", isUnlocked ? "text-sage" : "text-muted")}>
                  {isUnlocked ? (
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {isUnlocked ? `Unlocked · +${a.xp} XP` : `Locked · +${a.xp} XP`}
                </p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}