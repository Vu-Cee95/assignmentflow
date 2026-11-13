"use client";

import { BedDouble, Sparkles, Waves } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RestReminderModalProps {
  open: boolean;
  onClose: () => void;
  streak: number;
  onKeepGoing: () => void;
}

export function RestReminderModal({ open, onClose, streak, onKeepGoing }: RestReminderModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="That's today's goal reached">
      <div className="space-y-5 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-calm-blue-light text-calm-blue">
          <BedDouble className="size-10" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-ink">Nothing left to prove tonight.</p>
          <p className="text-sm text-muted">
            No more work required for today. Your brain consolidates while you rest — you earned it.{" "}
            {streak > 0 && <span className="font-semibold text-calm-blue">{streak}-day streak, keep it gentle.</span>}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-sunny-light p-3 text-sm font-semibold text-sunny">
          <Sparkles className="size-4" aria-hidden="true" />
          Great choice! Rest is part of the process.
        </div>
        <div className="grid gap-2.5">
          <Button size="full" onClick={onClose}>
            I'm Done for Today
          </Button>
          <Button variant="outline" size="full" icon={<Waves className="size-4" aria-hidden="true" />} onClick={onKeepGoing}>
            I'm in the flow, let me continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}