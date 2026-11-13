"use client";

import { Minimize2, TimerReset } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface StartTargetModalProps {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function StartTargetModal({ open, onClose, onStart }: StartTargetModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Ready when you are">
      <div className="space-y-4 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-calm-blue-light text-calm-blue">
          <TimerReset className="size-10" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted">
          Work happens wherever you are — Word, Google Docs, pen and paper. We never watch your screen
          and we never have to. This step is yours.
        </p>
        <p className="rounded-xl bg-canvas p-3 text-sm font-semibold text-ink">
          Take your time. Start small. Even five focused minutes moves the map.
        </p>
        <Button size="full" icon={<Minimize2 className="size-4" aria-hidden="true" />} onClick={onStart}>
          Minimize & Work
        </Button>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-muted cursor-pointer">
          Not now
        </button>
      </div>
    </Modal>
  );
}