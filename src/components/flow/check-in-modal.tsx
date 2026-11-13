"use client";

import { useState } from "react";
import { Battery, Flag, MessageSquareText, PartyPopper } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { CheckInResponses } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const ENERGY_OPTIONS = [
  { value: "energised", label: "Feel good", hint: "Locked in and productive" },
  { value: "ok", label: "Okay", hint: "Steady and getting through it" },
  { value: "drained", label: "Running on empty", hint: "It took everything to show up" },
] as const;

const PROGRESS_OPTIONS = [
  { value: "stuck", label: "Stuck", hint: "Couldn't quite get past one part" },
  { value: "wrapped-up", label: "Almost there", hint: "Nearly at my target" },
  { value: "at-target", label: "Hit my target", hint: "Reached today's step" },
] as const;

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (responses: CheckInResponses) => void;
}

export function CheckInModal({ open, onClose, onComplete }: CheckInModalProps) {
  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState<CheckInResponses["feeling"] | null>(null);
  const [progress, setProgress] = useState<CheckInResponses["progress"] | null>(null);
  const [notes, setNotes] = useState("");

  const pickFeeling = (v: CheckInResponses["feeling"]) => {
    setFeeling(v);
    setStep(1);
  };
  const pickProgress = (v: CheckInResponses["progress"]) => {
    setProgress(v);
  };

  const reset = () => {
    setStep(0);
    setFeeling(null);
    setProgress(null);
    setNotes("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const finish = () => {
    if (!feeling || !progress) return;
    onComplete({ feeling, progress, notes });
    reset();
  };

  return (
    <Modal open={open} onClose={close} title="How did it go?">
      <div className="space-y-4">
        {step === 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm text-muted">
              <Battery className="size-4" aria-hidden="true" />
              Step 1 of 2 — how is your energy?
            </p>
            <div className="grid gap-2" role="radiogroup" aria-label="Energy level">
              {ENERGY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={feeling === o.value}
                  onClick={() => pickFeeling(o.value)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left cursor-pointer transition-colors",
                    feeling === o.value
                      ? "border-calm-blue bg-calm-blue-light"
                      : "border-line bg-surface hover:border-calm-blue/50"
                  )}
                >
                  <span className="block font-bold text-ink">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm text-muted">
              <Flag className="size-4" aria-hidden="true" />
              Step 2 of 2 — how far did you get?
            </p>
            <div className="grid gap-2" role="radiogroup" aria-label="Progress level">
              {PROGRESS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={progress === o.value}
                  onClick={() => pickProgress(o.value)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left cursor-pointer transition-colors",
                    progress === o.value
                      ? "border-calm-blue bg-calm-blue-light"
                      : "border-line bg-surface hover:border-calm-blue/50"
                  )}
                >
                  <span className="block font-bold text-ink">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </button>
              ))}
            </div>
            {progress && (
              <div className="mt-4">
                <label htmlFor="checkin-notes" className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
                  <MessageSquareText className="size-4" aria-hidden="true" />
                  Anything to note? <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="checkin-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted/70"
                  placeholder="e.g. Peer test gave great feedback on the button labels"
                />
                <Button size="full" className="mt-4" onClick={finish}>
                  <PartyPopper className="size-4" aria-hidden="true" />
                  Finish check-in
                </Button>
              </div>
            )}
          </div>
        )}

        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-semibold text-calm-blue cursor-pointer">
            ← Back
          </button>
        )}
      </div>
    </Modal>
  );
}