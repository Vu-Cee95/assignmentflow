"use client";

import { CheckCheck, Footprints, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ReturnOutcome } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface ReturnOption {
  outcome: ReturnOutcome;
  label: string;
  hint: string;
  xp: number;
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: ReturnOption[] = [
  {
    outcome: "finished",
    label: "Yes, I finished it",
    hint: "Bank the full step — this is the big XP.",
    xp: 150,
    icon: CheckCheck,
  },
  {
    outcome: "progress",
    label: "I made some progress",
    hint: "Still counts. Step rolls to tomorrow and keeps you in the game.",
    xp: 50,
    icon: Footprints,
  },
  {
    outcome: "not-yet",
    label: "Not yet",
    hint: "No stress at all — nothing is lost, the step rolls to tomorrow.",
    xp: 0,
    icon: ShieldCheck,
  },
];

interface ReturnCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onChoose: (outcome: ReturnOutcome) => void;
}

export function ReturnCheckInModal({ open, onClose, onChoose }: ReturnCheckInModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Did you manage to make progress?">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Be honest — the only wrong answer is pretending. You never lose progress here.
        </p>
        <div className="grid gap-2.5">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.outcome}
                type="button"
                onClick={() => onChoose(o.outcome)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 text-left cursor-pointer transition-colors",
                  "border-line bg-surface hover:border-calm-blue/60"
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink">{o.label}</span>
                    <span className="text-xs font-bold text-sage">
                      {o.xp > 0 ? `+${o.xp} XP` : "no XP, no shame"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="rounded-xl bg-canvas p-3 text-xs text-muted">
          An early finish banks +150 XP and can be verified for a bonus. Rolls over? The streak shield
          has your back after two consistent days.
        </p>
      </div>
    </Modal>
  );
}