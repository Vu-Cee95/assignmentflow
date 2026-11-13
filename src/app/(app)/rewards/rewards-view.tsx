"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarHeart, CheckCircle2, Coins, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/store";
import { pointsBalance, unredeemed } from "@/lib/domain/state";
import { REWARD_CATEGORIES } from "@/lib/domain/types";
import type { AchievementId, Reward } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlowFridayModal } from "@/components/rewards/flow-friday-modal";

const CATEGORY_LABEL: Record<(typeof REWARD_CATEGORIES)[number], string> = {
  data: "Data",
  coffee: "Catering",
  printing: "Printing",
  stationery: "Stationery",
  transport: "Transport",
  groceries: "Groceries",
};

export function RewardsView() {
  const { state, dispatch } = useApp();
  const [flowFridayOpen, setFlowFridayOpen] = useState(false);
  const balance = pointsBalance(state);
  const available = unredeemed(state);

  const redeem = (id: Reward["id"]) => {
    dispatch({ type: "REDEEM_REWARD", id });
    dispatch({ type: "UNLOCK_ACHIEVEMENT", id: "reward-claim" as AchievementId });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Rewards</h1>
          <p className="text-sm text-muted">Small, real things for consistent gentle effort.</p>
        </div>
        <Card className="!p-3 flex items-center gap-2 !border-sunny/40 !bg-sunny-light">
          <Coins className="size-5 text-sunny" aria-hidden="true" />
          <span className="text-sm font-extrabold text-sunny">{formatNumber(balance)} XP</span>
        </Card>
      </header>

      <Card className="flex items-center gap-4 !border-sage/30">
        <div className="grid size-12 place-items-center rounded-2xl bg-sage-light text-sage">
          <CalendarHeart className="size-6" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-ink">Flow Friday</h2>
          <p className="text-sm text-muted">Pick a reward each week and earn it through consistent, verified daily steps.</p>
        </div>
        {available.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setFlowFridayOpen(true)}>
            Choose this week&apos;s reward
          </Button>
        ) : (
          <span className="text-xs font-bold text-muted">All rewards redeemed</span>
        )}
      </Card>
      <FlowFridayModal
        open={flowFridayOpen}
        onClose={() => setFlowFridayOpen(false)}
        rewards={available}
        balance={balance}
        onSelect={redeem}
      />

      {available.length === 0 ? (
        <Card className="text-center py-10">
          <CheckCircle2 className="mx-auto size-10 text-sage" aria-hidden="true" />
          <p className="mt-3 font-bold text-ink">You've redeemed everything.</p>
          <p className="mt-1 text-sm text-muted">Complete more daily steps to unlock fresh rewards.</p>
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-calm-blue">
            <TrendingUp className="size-4" aria-hidden="true" />
            Back to today&apos;s step
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((r) => {
            const affordable = balance >= r.cost;
            return (
              <Card key={r.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge tone="neutral">{CATEGORY_LABEL[r.category]}</Badge>
                    <h2 className="mt-2 font-bold text-ink">{r.title}</h2>
                  </div>
                  <span className="text-lg font-extrabold text-calm-blue">{r.cost}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{r.description}</p>
                <div className="flex-1" />
                <Button
                  variant={affordable ? "primary" : "ghost"}
                  size="full"
                  className="mt-4"
                  disabled={!affordable}
                  onClick={() => redeem(r.id)}
                >
                  {affordable ? "Redeem" : `Need ${formatNumber(r.cost - balance)} more XP`}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <section aria-label="How redeeming works">
        <ul className="rounded-2xl border border-line bg-canvas p-4 text-sm text-muted grid gap-2">
          <li>— Steps you complete bank XP; verification is your proof.</li>
          <li>— Redeeming keeps your momentum honest: prize arrives, plan stays.</li>
          <li>— Balance refreshes as you complete your daily step.</li>
        </ul>
      </section>
    </div>
  );
}