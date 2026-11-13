"use client";

import { Flame, Rocket } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface FlowStateModalProps {
  open: boolean;
  onClose: () => void;
  nextTarget: { id: string; label: string; minutes: number } | null;
  onContinue: () => void;
}

export function FlowStateModal({ open, onClose, nextTarget, onContinue }: FlowStateModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="You're in the flow">
      <div className="space-y-4 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-peach-light text-peach">
          <Flame className="size-10" aria-hidden="true" />
        </div>
        <p className="text-lg font-bold text-ink">+200 bonus XP banked.</p>
        <p className="text-sm text-muted">
          Momentum is the rarest resource — when it shows up, we never guilt you into using it.
          Ride it as far as you like.
        </p>
        {nextTarget && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 p-3 text-left">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
              <Rocket className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Optional next step: {nextTarget.label}</p>
              <p className="text-xs text-muted">~{nextTarget.minutes} min — completely optional</p>
            </div>
          </div>
        )}
        {nextTarget ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              I'm done
            </Button>
            <Button className="flex-1" icon={<Rocket className="size-4" aria-hidden="true" />} onClick={onContinue}>
              Let's ride
            </Button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            <p className="rounded-xl bg-canvas p-3 text-sm text-muted">
              No more steps planned right now — add one in Assignments to keep riding.
            </p>
            <Button size="full" onClick={onClose}>
              I'm done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}