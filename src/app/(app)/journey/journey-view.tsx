"use client";

import { useMemo } from "react";
import { Award, Check, Clock, Flag, Flame, Milestone, ShieldCheck, Sparkles, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { dailyStreak, streakWithShield, todayIso } from "@/lib/domain/state";
import { daysFromNowISO, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function JourneyView() {
  const { state } = useApp();
  const today = todayIso();
  const touched = new Date(`${todayIso()}T00:00:00Z`);
  const tomorrow = new Date(touched.getTime() + 86400000).toISOString().slice(0, 10);

  const completed = useMemo(
    () =>
      state.dailyTargets
        .filter((d) => d.status === "completed")
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.dailyTargets]
  );

  const missed = useMemo(
    () =>
      state.dailyTargets
        .filter((d) => d.date < today && d.status !== "completed")
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.dailyTargets, today]
  );

  const todays = state.dailyTargets.find((d) => d.date === today);
  const tomorrows = state.dailyTargets.find((d) => d.date === tomorrow);

  const totalMinutes = completed.reduce((sum, d) => sum + d.minutes, 0);
  const totalXp = completed.reduce((sum, d) => sum + d.xpEarned, 0);

  const { streak, shieldUsed } = streakWithShield(state);
  const completedDates = useMemo(
    () => new Set(state.dailyTargets.filter((d) => d.status === "completed").map((d) => d.date)),
    [state.dailyTargets]
  );
  const last14 = useMemo(
    () => Array.from({ length: 14 }, (_, i) => daysFromNowISO(i - 13)),
    []
  );
  const dailyStreakCount = dailyStreak(state);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">My Journey</h1>
        <p className="text-sm text-muted">Every gentle step, plotted on the map to submission.</p>
      </header>

      <section aria-label="Journey summary" className="grid gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Steps done</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{completed.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Minutes focused</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{totalMinutes}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">XP earned</p>
          <p className="mt-1 text-2xl font-extrabold text-calm-blue">{totalXp}</p>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Flame className="size-4 text-warm" aria-hidden="true" />
            Streak
            <span className="rounded-full bg-calm-blue-light px-2 py-0.5 text-xs font-extrabold text-calm-blue">
              {streak} day{streak === 1 ? "" : "s"}
            </span>
            {shieldUsed && <span className="text-xs font-semibold text-lavender">shield used</span>}
          </p>
          <p className="text-xs text-muted">A daily step earned, every day. Today still counts.</p>
        </div>
        <ul className="mt-4 grid grid-cols-7 gap-1.5 sm:grid-cols-14" aria-label="Last 14 days">
          {last14.map((date) => {
            const isToday = date === today;
            const done = completedDates.has(date);
            const wasMissed = date < today && !done;
            const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
            return (
              <li
                key={date}
                title={`${shortDate(date)} — ${done ? "completed" : wasMissed ? "missed" : isToday ? "today" : "upcoming"}`}
                className={`grid h-10 place-items-center rounded-lg text-xs font-bold transition-colors ${
                  done
                    ? "bg-sage text-white"
                    : isToday
                      ? "bg-calm-blue-light text-calm-blue ring-1 ring-calm-blue"
                      : wasMissed
                        ? "bg-peach-light/60 text-peach"
                        : "border border-line bg-surface text-muted"
                }`}
              >
                {weekday}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Current consecutive streak: <strong className="text-ink">{dailyStreakCount}</strong> day
          {dailyStreakCount === 1 ? "" : "s"}.
        </p>
      </Card>

      <section aria-label="Your path so far">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Your path</h2>
        <ol className="relative ml-3 border-s-2 border-line pl-6">
          <li className="relative pb-6">
            <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full bg-line text-muted">
              <Flag className="size-3" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-ink">You showed up and started</p>
            <p className="text-xs text-muted">Week 1 — first step of your POE</p>
          </li>

          {completed.map((d) => (
            <li key={d.id} className="relative pb-6">
              <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full bg-sage text-white">
                <Check className="size-3" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-ink">{d.label}</p>
              <p className="text-xs text-muted">
                {shortDate(d.date)} · {d.minutes} min · +{d.xpEarned} XP
              </p>
              {d.verification && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sage-light px-3 py-1 text-xs font-bold text-sage">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Verified {d.verification.score}/{d.verification.max} · {d.verification.verdict}
                </p>
              )}
            </li>
          ))}

          {missed.map((d) => (
            <li key={d.id} className="relative pb-6 opacity-60">
              <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full border-2 border-peach/50 text-peach">
                <X className="size-3" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-ink line-through">{d.label}</p>
              <p className="text-xs text-muted">Missed · planned for {shortDate(d.date)}</p>
            </li>
          ))}

          {todays && todays.status !== "completed" && (
            <li className="relative pb-6">
              <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full bg-calm-blue text-white ring-4 ring-calm-blue/20">
                <Clock className="size-3" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-calm-blue">{todays.label}</p>
              <p className="text-xs text-muted">Today · {todays.minutes} min · in progress</p>
              <Badge tone="primary" className="mt-1">You are here</Badge>
            </li>
          )}

          {tomorrows && (
            <li className="relative pb-6 opacity-70">
              <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full border-2 border-dashed border-line text-muted">
                <Clock className="size-3" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-ink">{tomorrows.label}</p>
              <p className="text-xs text-muted">Tomorrow · planned</p>
            </li>
          )}

          {state.assignments.map((a) => (
            <li key={a.id} className="relative pb-6">
              <span className="absolute -start-[33px] grid size-6 place-items-center rounded-full bg-lavender-light text-lavender">
                <Award className="size-3" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-ink">{a.title}</p>
              <p className="text-xs text-muted">Submission milestone · due {shortDate(a.due)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Milestone rails">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Milestone className="size-4" aria-hidden="true" /> Milestone rails
        </h2>
        <div className="grid gap-3">
          {state.assignments.map((a) => (
            <Card key={a.id} className="!p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">{a.title}</p>
                <span className="text-sm font-extrabold text-calm-blue">{a.progressPct}%</span>
              </div>
              <div className="mt-4 flex justify-between" aria-hidden="true">
                {[25, 50, 75, 100].map((m) => {
                  const reached = a.progressPct >= m;
                  return (
                    <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
                      <span
                        className={`h-2.5 w-full rounded-full transition-colors ${reached ? "bg-sage" : "bg-line/50"}`}
                      />
                      <span className={`text-[10px] font-bold ${reached ? "text-ink" : "text-muted"}`}>
                        {m}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted">
                {a.progressPct >= 100
                  ? "Complete — submission ahead of you."
                  : "Each milestone is one more quarter of the work, done."}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card tone="accent" className="flex items-center gap-3">
        <Sparkles className="size-5 text-lavender" aria-hidden="true" />
        <p className="text-sm text-ink">
          Six days: six steps, zero burnouts. The map is just a record —
          <strong> add tomorrow's step in Assignments and keep the line moving.</strong>
        </p>
      </Card>
    </div>
  );
}