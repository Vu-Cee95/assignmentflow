"use client";

import { useState } from "react";
import { CalendarHeart, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REWARD_CATEGORIES } from "@/lib/domain/types";
import type { Reward } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";

const CATEGORY_LABEL: Record<(typeof REWARD_CATEGORIES)[number], string> = {
  data: "Data",
  coffee: "Coffee",
  printing: "Printing",
  stationery: "Stationery",
  transport: "Transport",
  groceries: "Groceries",
};

interface FlowFridayModalProps {
  open: boolean;
  onClose: () => void;
  rewards: Reward[];
  balance: number;
  onSelect: (id: Reward["id"]) => void;
}

export function FlowFridayModal({ open, onClose, rewards, balance, onSelect }: FlowFridayModalProps) {
  const [picked, setPicked] = useState<Reward | null>(null);

  const close = () => {
    setPicked(null);
    onClose();
  };

  const confirm = () => {
    if (!picked || balance < picked.cost) return;
    onSelect(picked.id);
    setPicked(null);
    onClose();
  };

  if (!open) return null;

  if (picked) {
    const affordable = balance >= (picked?.cost ?? Infinity);
    return (
      <Modal open={open} onClose={close} title="This week's reward is set">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage-light text-sage">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold text-ink">{picked.title}</p>
          <p className="text-sm text-muted">
            Complete your daily steps this week with verified sessions and it&apos;s yours. Gentle work,
            tangible prize.
          </p>
          <Button size="full" variant="success" disabled={!affordable} onClick={confirm}>
            {affordable ? "Confirm & close" : `Need ${picked.cost - balance} more XP`}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title="Flow Friday — choose this week's reward">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Pick the reward you&apos;re working toward this week. Earn it through consistent, verified
          daily steps — it&apos;s that simple.
        </p>
        <div className="grid gap-2.5">
          {rewards.map((r) => {
            const affordable = balance >= r.cost;
            return (
              <button
                key={r.id}
                type="button"
                disabled={!affordable}
                onClick={() => setPicked(r)}
                aria-label={affordable ? `Choose ${r.title}` : `${r.title} — need ${formatNumber(r.cost - balance)} more XP`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 text-left cursor-pointer transition-colors hover:border-calm-blue/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
              >
                <span className="flex-1">
                  <span className="block font-bold text-ink">{r.title}</span>
                  <span className="block text-xs text-muted">{r.description}</span>
                </span>
                <Badge tone="neutral">{CATEGORY_LABEL[r.category]}</Badge>
                {affordable ? (
                  <span className="text-sm font-extrabold text-calm-blue">{r.cost} XP</span>
                ) : (
                  <span className="text-xs font-bold text-muted">Need {formatNumber(r.cost - balance)} more</span>
                )}
              </button>
            );
          })}
          {rewards.length === 0 && (
            <p className="rounded-xl bg-canvas p-3 text-sm text-muted">
              Nothing to choose right now — complete daily steps to unlock fresh rewards.
            </p>
          )}
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-xs text-muted">
          <CalendarHeart className="mt-0.5 size-4 shrink-0 text-lavender" aria-hidden="true" />
          Rewards are funded by university partnerships and corporate sponsorship — never from your
          data. Your study data stays on your device.
        </p>
      </div>
    </Modal>
  );
}