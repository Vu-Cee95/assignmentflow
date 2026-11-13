"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Gauge,
  ListChecks,
  PartyPopper,
  Plus,
  SlidersHorizontal,
  Trash2,
  Users,
  Wand2,
  X,
  Check,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { Assignment, AssignmentId, DailyTarget, TaskId } from "@/lib/domain/types";
import { buildDailyPlan, daysUntil } from "@/lib/domain/state";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Modal } from "@/components/ui/modal";
import { Field, TextInput } from "@/components/ui/field";
import { uid, cn, daysFromNowISO } from "@/lib/utils";
import { COMMUNITY_MODULES } from "@/lib/data/mock";

interface PlanRow {
  id: string;
  question: string;
  title: string;
  minutes: number;
}

type Pace = 1 | 2 | 3;

const SUBTASK_TITLES = [
  "Outline & clarifying questions",
  "Draft the structure",
  "Draft the content",
  "Polish, citations & references",
  "Final review & submit",
];

const MINUTES = 180;

function questionFor(index: number): string {
  return `1.${index + 1}`;
}

/** Builds the recommended sub-task list from the days available. */
function recommend(days: number): PlanRow[] {
  const count = Math.min(SUBTASK_TITLES.length, Math.max(2, days));
  const minutes = Math.round(MINUTES / count / 5) * 5;
  return SUBTASK_TITLES.slice(0, count).map((title, i) => ({
    id: uid("tk"),
    question: questionFor(i),
    title,
    minutes: minutes >= 15 ? minutes : 15,
  }));
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const PACE_OPTIONS: { pace: Pace; hint: string }[] = [
  { pace: 1, hint: "Gentle" },
  { pace: 2, hint: "Balanced" },
  { pace: 3, hint: "Focused" },
];

export function CreateAssignmentView() {
  const { dispatch } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [plan, setPlan] = useState<PlanRow[]>([]);
  const [pace, setPace] = useState<Pace>(1);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [touchedDue, setTouchedDue] = useState(false);

  const codeNorm = code.trim().toUpperCase();
  const communityModule = COMMUNITY_MODULES.find((m) => m.code === codeNorm);
  const dayCount = useMemo(() => daysUntil(due), [due]);
  const availableDays = Math.max(1, dayCount - 2);

  const generatePlan = () => {
    if (!code.trim() || !title.trim()) return;
    setPlan(recommend(dayCount));
    setStep(1);
  };

  const goToPlan = () => {
    const p: Pace = Math.min(3, Math.max(1, Math.ceil(plan.length / availableDays))) as Pace;
    setPace(p);
    setStep(2);
  };

  const tasksFor = (rows: PlanRow[]): Assignment["tasks"] =>
    rows.map((r) => ({
      id: r.id as TaskId,
      title: r.title,
      estMinutes: r.minutes,
      question: r.question,
      status: "pending" as const,
    }));

  const assignmentId = useMemo(() => uid("as") as AssignmentId, []);
  const taskRows = useMemo(() => tasksFor(plan), [plan]);
  const preview = useMemo<DailyTarget[]>(
    () => (taskRows.length ? buildDailyPlan(taskRows, assignmentId, due, pace) : []),
    [taskRows, assignmentId, due, pace]
  );

  const estimatedDate = preview.length > 0 ? preview[preview.length - 1]!.date : due;
  const recommendedPace = Math.min(3, Math.max(1, Math.ceil(plan.length / Math.max(1, availableDays)))) as Pace;

  const completionFor = (p: Pace): string => {
    const daysToFinish = Math.ceil(plan.length / p);
    return daysFromNowISO(daysToFinish - 1);
  };

  const updateRow = (id: string, patch: Partial<PlanRow>) =>
    setPlan((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () =>
    setPlan((prev) => [
      ...prev,
      { id: uid("tk"), question: questionFor(prev.length), title: "Extra polish session", minutes: 30 },
    ]);

  const removeRow = (id: string) =>
    setPlan((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, question: questionFor(i) })));

  const totalMinutes = plan.reduce((sum, r) => sum + r.minutes, 0);
  const xpEstimate = preview.length * 150;

  const accept = () => {
    const id = uid("as") as AssignmentId;
    const assignment: Assignment = {
      id,
      code: codeNorm.slice(0, 10),
      title: title.trim(),
      due: new Date(due).toISOString(),
      progressPct: 0,
      tasks: tasksFor(plan),
    };
    const targets = buildDailyPlan(assignment.tasks, id, due, pace);
    dispatch({ type: "ADD_ASSIGNMENT", assignment });
    dispatch({ type: "ADD_DAILY_TARGETS", targets });
    dispatch({ type: "SET_ACTIVE_ASSIGNMENT", id });
    router.push("/dashboard");
  };

  const todayDate = new Date().toISOString().slice(0, 10);
  const dueInvalid = Boolean(due) && due < todayDate;
  const dueError = dueInvalid ? "Please enter a valid future date." : undefined;
  const filledFields = [code.trim(), title.trim(), touchedDue].filter(Boolean).length;
  const stepProgress = step === 0 ? filledFields / 3 : 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Plan a new assignment</h1>
        <p className="text-sm text-muted">Describe it once — we'll carve it into gentle daily steps.</p>
      </header>

      <Stepper steps={["Details", "Sub-tasks", "Daily plan", "Accepted"]} current={step} progress={stepProgress} />

      {step === 0 && (
        <Card className="space-y-4">
          <Field label="Module code" required>
            <TextInput
              id="plan-code"
              placeholder="e.g. HCIN6222"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={12}
            />
            {communityModule && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-calm-blue">
                <Users className="size-3.5" aria-hidden="true" />
                {communityModule.students} students have entered this module
              </p>
            )}
          </Field>
          <Field label="Assignment title" required>
            <TextInput id="plan-title" placeholder="e.g. HCI POE Part 2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Due date" required error={touchedDue ? dueError : undefined}>
            <TextInput
              id="plan-due"
              type="date"
              value={due}
              min={todayDate}
              invalid={touchedDue && dueInvalid}
              onChange={(e) => { setDue(e.target.value); setTouchedDue(true); }}
            />
            {!dueError && (
              <p className="mt-1.5 text-xs text-muted">
                {dayCount} day{dayCount > 1 ? "s" : ""} from today — we keep a 2-day buffer ({availableDays} working days) so you're never last-minute.
              </p>
            )}
          </Field>
          <Button size="full" icon={<Wand2 className="size-4" aria-hidden="true" />} disabled={!code.trim() || !title.trim() || dueInvalid} onClick={generatePlan}>
            Break it into sub-tasks
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card aria-labelledby="subtasks-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="subtasks-title" className="font-bold text-ink">Break it into sub-tasks</h2>
              <p className="mt-0.5 text-sm text-muted">
                Each question gets a number (1.1, 1.2…). Rename, re-time, add or remove — then build your daily plan.
              </p>
            </div>
            <Badge tone="primary">{plan.length} sub-tasks</Badge>
          </div>
          <ul className="grid gap-3">
            {plan.map((r, i) => (
              <li key={r.id} className="rounded-xl border border-line bg-canvas/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted">
                    Question <span className="text-calm-blue">{r.question}</span>
                  </span>
                  <Tooltip label="Remove">
                    <button type="button" onClick={() => removeRow(r.id)} aria-label={`Remove question ${r.question}`} className="rounded-lg p-1 text-peach hover:bg-peach-light cursor-pointer">
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-24 shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                    value={r.question}
                    onChange={(e) => updateRow(r.id, { question: e.target.value })}
                    aria-label={`Question ${i + 1} number`}
                  />
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                    value={r.title}
                    onChange={(e) => updateRow(r.id, { title: e.target.value })}
                    aria-label={`Question ${r.question} text`}
                  />
                </div>
                <label className="mt-2 block text-xs font-semibold text-muted">
                  Est. minutes
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={r.minutes}
                    onChange={(e) => updateRow(r.id, { minutes: Math.max(10, Number(e.target.value) || 10) })}
                    className="mt-1 w-28 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                    aria-label={`Question ${r.question} minutes`}
                  />
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-calm-blue cursor-pointer">
            <Plus className="size-4" aria-hidden="true" />
            Add a sub-task
          </button>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" icon={<ListChecks className="size-4" aria-hidden="true" />} disabled={plan.length === 0} onClick={goToPlan}>
              Generate daily plan
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card aria-labelledby="daily-plan-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="daily-plan-title" className="font-bold text-ink">Your daily plan</h2>
              <p className="mt-0.5 text-sm text-muted">
                {preview.length} gentle targets · ≈ {totalMinutes} min total · ~{xpEstimate} XP
              </p>
            </div>
            <Badge tone="success">{preview.length} targets</Badge>
          </div>

          <div className="mb-4 rounded-xl bg-calm-blue-light/60 p-3 text-sm text-ink">
            <p className="font-semibold">
              {plan.length} sub-questions across {availableDays} working days → about{" "}
              <strong>{recommendedPace} per day</strong>, finishing ~{shortDate(estimatedDate)}.
            </p>
            <p className="mt-0.5 text-xs text-muted">
              That lands well before your {shortDate(due)} deadline. {recommendedPace === 1 ? "Gentle pace, zero burnouts." : recommendedPace === 2 ? "Balanced pace — steady and sustainable." : "Focused pace — plenty of buffer still left."}
            </p>
          </div>

          <ul className="grid gap-2.5">
            {preview.map((t, i) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <CalendarCheck2 className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{t.label}</p>
                  <p className="text-xs text-muted">
                    Day {i + 1} · {shortDate(t.date)}
                  </p>
                </div>
                <span className="text-xs font-bold text-muted">{t.minutes}m</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-xl bg-canvas p-3 text-sm text-muted">
            Each target becomes a daily check-in: start it, work externally, return and verify. Roughly{" "}
            <strong className="text-calm-blue">{xpEstimate} XP</strong> on offer when you finish them all.
          </p>

          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-calm-blue cursor-pointer"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Adjust daily pace
          </button>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" icon={<CheckCircle2 className="size-4" aria-hidden="true" />} onClick={() => setStep(3)}>
              Accept plan
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card aria-labelledby="accepted-title" tone="success" className="text-center">
          <PartyPopper className="mx-auto size-10 text-sage" aria-hidden="true" />
          <h2 id="accepted-title" className="mt-3 text-lg font-bold text-ink">Plan accepted — well done!</h2>
          <p className="mt-1 text-sm text-muted">
            <strong className="text-ink">{title}</strong> is now {preview.length} gentle daily targets.
          </p>
          <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-muted">
            ≈ {totalMinutes} minutes of work across {preview.length} days · ~
            <strong className="text-calm-blue">{xpEstimate} XP</strong> when you finish
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {preview.map((t, i) => (
              <span key={t.id} className={cn("rounded-full px-3 py-1 text-xs font-semibold", i === 0 ? "bg-calm-blue-light text-calm-blue" : "bg-line/50 text-muted")}>
                {i + 1}. {shortDate(t.date)}
              </span>
            ))}
          </div>
          <Button size="full" className="mt-5" icon={<CalendarPlus className="size-4" aria-hidden="true" />} onClick={accept}>
            Add to my plan
          </Button>
          <Button size="full" className="mt-2" variant="outline" onClick={() => setStep(2)}>
            Back to plan
          </Button>
        </Card>
      )}

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust your daily pace">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Pick how many sub-questions you'd like to tackle per day. The plan updates instantly.
          </p>
          <div className="grid gap-2.5" role="radiogroup" aria-label="Sub-questions per day">
            {PACE_OPTIONS.map((o) => {
              const active = pace === o.pace;
              return (
                <button
                  key={o.pace}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPace(o.pace)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-left cursor-pointer transition-colors",
                    active ? "border-calm-blue bg-calm-blue-light" : "border-line bg-surface hover:border-calm-blue/40"
                  )}
                >
                  <span className={cn("grid size-5 place-items-center rounded-full border", active ? "border-calm-blue" : "border-line")}>
                    {active && <Check className="size-3.5 text-calm-blue" aria-hidden="true" />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink">{o.pace} per day · {o.hint}</span>
                    <span className="block text-xs text-muted">Complete ~{shortDate(completionFor(o.pace))}</span>
                  </span>
                  <Gauge className={cn("size-5", active ? "text-calm-blue" : "text-muted")} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" icon={<X className="size-4" aria-hidden="true" />} onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" icon={<Check className="size-4" aria-hidden="true" />} onClick={() => setAdjustOpen(false)}>
              Save plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}