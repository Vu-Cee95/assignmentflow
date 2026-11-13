"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useApp } from "@/lib/store";
import {
  missedYesterday,
  streakWithShield,
  todayCompleted,
  todayIso,
  todayTarget,
  xpIntoLevel,
} from "@/lib/domain/state";
import type { AchievementId, ReturnOutcome, TargetId, VerificationEvidence, VerificationResult } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReturnCheckInModal } from "@/components/flow/return-check-in-modal";
import { StartTargetModal } from "@/components/flow/start-target-modal";
import { VerificationModal } from "@/components/flow/verification-modal";
import { RestReminderModal } from "@/components/flow/rest-reminder-modal";
import { FlowStateModal } from "@/components/flow/flow-state-modal";
import { formatNumber, shortDate } from "@/lib/utils";

const THEME_CHART_COLORS = {
  default: { muted: "#596274", line: "#e1e5ef", primary: "#3556c8" },
  dark: { muted: "#9aa3b8", line: "#333a4e", primary: "#7c95ec" },
  "high-contrast": { muted: "#20242c", line: "#6b7280", primary: "#0b2c8f" },
} as const;

type FlowStep = "none" | "start" | "checkin" | "verify" | "rest" | "flow";

export function DashboardView() {
  const { state, dispatch } = useApp();
  const [flow, setFlow] = useState<FlowStep>("none");
  const [checkInBanner, setCheckInBanner] = useState<"progress" | "not-yet" | null>(null);
  /** The target being verified — captured at check-in so the modal keeps the right
   * context and the score lands on the target that actually finished. */
  const [verifyTargetId, setVerifyTargetId] = useState<TargetId | null>(null);

  /* Recharts applies inline SVG colors — mirror the current theme's tokens so the
   * chart matches whatever palette is active (kept in sync with globals.css). */
  const theme = state.user?.preferences.theme ?? "default";
  const chartColors =
    THEME_CHART_COLORS[theme] ?? THEME_CHART_COLORS["default"];

  const target = todayTarget(state);
  const done = todayCompleted(state);
  const { streak, shieldUsed } = streakWithShield(state);
  const xp = state.user?.xp ?? 0;
  const level = xpIntoLevel(xp);

  const weekData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
    const completedByDate = new Map(
      state.dailyTargets.filter((d) => d.status === "completed").map((d) => [d.date, d])
    );
    const today = new Date(`${todayIso()}T00:00:00Z`);
    const points: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const t = completedByDate.get(date);
      points.push({
        day: days[(d.getDay() + 6) % 7] ?? "",
        minutes: t?.minutes ?? 0,
      });
    }
    return points;
  }, [state.dailyTargets]);

  const doneToday = state.dailyTargets.find(
    (d) => d.date === todayIso() && d.status === "completed"
  );
  const today = todayIso();
  const working = target?.status === "in_progress";

  /* Assignment context the verification keyword-match layer checks the pasted question against.
   Derives from the verified target (not todayTarget), which can change after check-in. */
  const verifyTarget = verifyTargetId
    ? state.dailyTargets.find((d) => d.id === verifyTargetId)
    : null;
  const verifyContext = useMemo(() => {
    if (!verifyTarget) return undefined;
    const a = state.assignments.find((x) => x.id === verifyTarget.assignmentId);
    if (!a) return undefined;
    return {
      code: a.code,
      text: `${a.title}. ${a.tasks.map((t) => t.title).join(". ")}`,
    };
  }, [verifyTarget, state.assignments]);

  const hasOpenWork = useMemo(
    () => state.assignments.some((a) => a.tasks.some((t) => t.status !== "completed")),
    [state.assignments]
  );

  const startTarget = () => {
    if (!target) return;
    dispatch({ type: "START_TARGET", id: target.id });
    setFlow("none");
  };

  const closeFlow = () => {
    setVerifyTargetId(null);
    setFlow("none");
  };

  const onCheckIn = (outcome: ReturnOutcome) => {
    if (!target) return;
    dispatch({ type: "RETURN_CHECK_IN", targetId: target.id, outcome });
    if (outcome === "finished") {
      setVerifyTargetId(target.id);
      setCheckInBanner(null);
      setFlow("verify");
    } else {
      setCheckInBanner(outcome === "progress" ? "progress" : "not-yet");
      setFlow("none");
    }
  };

  const onVerified = (result: VerificationResult, evidence: VerificationEvidence) => {
    if (verifyTargetId && result.total > 0) {
      dispatch({
        type: "RECORD_TARGET_VERIFICATION",
        targetId: verifyTargetId,
        record: {
          score: result.total,
          max: result.max,
          verdict: result.verdict.kind,
          layers: result.layers,
          at: new Date().toISOString(),
          evidence,
        },
      });
    }
    if (result.total >= 50) dispatch({ type: "ADD_XP", amount: 50 });
    if (result.total >= 80)
      dispatch({ type: "UNLOCK_ACHIEVEMENT", id: "verification-pro" as AchievementId });
    setVerifyTargetId(null);
    setFlow("rest");
  };

  const nextTarget = useMemo(() => {
    if (!target) return null;
    const open = [...state.dailyTargets]
      .filter((d) => d.id !== target.id && d.status !== "completed")
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const n = open[0];
    return n ? { id: n.id, label: n.label, minutes: n.minutes } : null;
  }, [state.dailyTargets, target]);

  return (
    <div className="space-y-6">
      <section aria-labelledby="greeting" className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 id="greeting" className="text-2xl font-extrabold text-ink">
            Hi, {state.user?.name.split(" ")[0] ?? "there"} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {shieldUsed && (
            <Badge tone="accent" icon={<ShieldCheck className="size-4" aria-hidden="true" />}>
              Shield saved your streak
            </Badge>
          )}
          <Badge tone="warm" icon={<Flame className="size-4" aria-hidden="true" />}>
            {streak}-day streak
          </Badge>
        </div>
      </section>

      {checkInBanner === "progress" && (
        <section
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-sage/40 bg-sage-light px-4 py-3"
        >
          <p className="font-extrabold text-sage">Every step counts!</p>
          <p className="text-sm text-ink">You earned 50 XP. Today&apos;s target rolls over to tomorrow.</p>
        </section>
      )}
      {checkInBanner === "not-yet" && (
        <section
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-calm-blue/40 bg-calm-blue-light px-4 py-3"
        >
          <p className="font-extrabold text-calm-blue">That&apos;s okay. Life happens. Your progress is safe.</p>
          <p className="text-sm text-ink">No XP is taken away. The same step will be waiting tomorrow.</p>
        </section>
      )}

      {working && target && (
        <section
          aria-label="Working session banner"
          className="flex items-center gap-3 rounded-2xl border border-calm-blue/40 bg-calm-blue-light/60 px-4 py-3"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue text-white">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              Working on {target.assignmentCode} · {target.label}
            </p>
            <p className="text-xs text-muted">It's all happening where you're working — take your time.</p>
          </div>
          <Button variant="success" onClick={() => setFlow("checkin")}>
            Check in
          </Button>
        </section>
      )}

      <section aria-label="Your XP progress" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <span className="grid size-11 place-items-center rounded-xl bg-sunny-light text-sunny">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-ink">
              Level {level.level} · {formatNumber(xp)} XP
            </p>
            <p className="text-xs font-semibold text-muted">
              {level.next - xp} XP to level {level.level + 1}
            </p>
          </div>
          <Progress className="mt-2" value={xp} max={level.next} label={`XP progress toward level ${level.level + 1}`} tone="primary" />
        </div>
      </section>

      {done ? (
        <Card tone="success" aria-labelledby="today-done">
          <CardHeader>
            <CardTitle id="today-done">Today's step is done ✓</CardTitle>
            <CheckCircle2 className="size-6 text-sage" aria-hidden="true" />
          </CardHeader>
          <p className="text-sm text-muted">
            You banked <strong className="text-sage">{done.xpEarned} XP</strong> for <em>{done.label}</em>.
            Rest, recharge, and come back gentle tomorrow.
          </p>
          {done.verification && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sage-light px-3 py-1 text-xs font-bold text-sage">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Verified {done.verification.score}/{done.verification.max} ·{" "}
              {done.verification.layers.filter((l) => l.score > 0).length} layers with proof
            </p>
          )}
          <Link href="/assignments" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-calm-blue">
            View all tasks <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>
      ) : target ? (
        <Card aria-labelledby="today-target" className="relative overflow-hidden">
          {doneToday && (
            <div className="absolute inset-x-0 top-0 h-1 bg-sage" aria-hidden="true" />
          )}
          <CardHeader>
            <CardTitle id="today-target">
              Today's step
              <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wide text-calm-blue">
                {working ? "in progress" : "ready"}
              </span>
            </CardTitle>
            <Badge tone="primary">{target.assignmentCode}</Badge>
            {target.date !== today && <Badge tone="neutral">next · {shortDate(target.date)}</Badge>}
          </CardHeader>
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-calm-blue-light text-calm-blue">
              <Target className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-ink">{target.label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <Clock className="size-4" aria-hidden="true" />
                {target.minutes} minutes · {target.assignmentTitle}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {working ? (
              <Button size="full" variant="success" onClick={() => setFlow("checkin")}>
                Return & check in
              </Button>
            ) : (
              <Button size="full" icon={<Play className="size-4" aria-hidden="true" />} onClick={() => setFlow("start")}>
                Start today's target
              </Button>
            )}
            <p className="text-center text-xs text-muted">
              No pressure — half a step still counts as a step.
            </p>
          </div>
        </Card>
      ) : (
        <Card aria-labelledby="no-target">
          <p id="no-target" className="font-bold text-ink">No step planned for today.</p>
          <p className="mt-1 text-sm text-muted">
            {hasOpenWork
              ? "You still have open tasks — re-plan daily steps for an assignment to keep moving."
              : "Pick a task from an assignment and give it a gentle time-box."}
          </p>
          {hasOpenWork ? (
            <Link
              href="/assignments"
              className="mt-4 inline-flex rounded-xl bg-calm-blue px-5 py-2.5 text-sm font-semibold text-white"
            >
              Re-plan daily steps
            </Link>
          ) : (
            <Link
              href="/assignments/create"
              className="mt-4 inline-flex rounded-xl bg-calm-blue px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add an assignment
            </Link>
          )}
        </Card>
      )}

      {missedYesterday(state) && !working && !done && (
        <Card className="flex items-center gap-3 !border-peach/40">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peach-light text-peach">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-ink">
            Missed yesterday? The shield keeps your streak — come back today and you'll still bank a{" "}
            <strong className="text-sage">+100 comeback bonus</strong>.
          </p>
        </Card>
      )}

      <section aria-labelledby="week-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <CardHeader className="!mb-0 pb-3">
          <CardTitle id="week-title">Last 7 days</CardTitle>
          <span className="text-xs font-semibold text-muted">
            {formatNumber(weekData.reduce((sum, d) => sum + d.minutes, 0))} min focused
          </span>
        </CardHeader>
        <div className="h-40" role="img" aria-label="Bar chart of minutes focused per day over the last week">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: chartColors.muted }} interval="preserveStartEnd" />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.line}`, backgroundColor: "var(--af-surface)", color: "var(--af-ink)", fontSize: 12 }} />
              <Line type="monotone" dataKey="minutes" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <StartTargetModal open={flow === "start"} onClose={closeFlow} onStart={startTarget} />
      <ReturnCheckInModal open={flow === "checkin"} onClose={closeFlow} onChoose={onCheckIn} />
      <VerificationModal open={flow === "verify"} onClose={closeFlow} onVerified={onVerified} context={verifyContext} />
      <RestReminderModal
        open={flow === "rest"}
        onClose={closeFlow}
        streak={streak}
        onKeepGoing={() => {
          dispatch({ type: "ADD_XP", amount: 200 });
          setFlow("flow");
        }}
      />
      <FlowStateModal
        open={flow === "flow"}
        onClose={closeFlow}
        nextTarget={nextTarget}
        onContinue={() => {
          if (nextTarget) dispatch({ type: "START_TARGET", id: nextTarget.id });
          setFlow("none");
        }}
      />
    </div>
  );
}