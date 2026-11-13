"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  PartyPopper,
  Pencil,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { daysUntil } from "@/lib/domain/state";
import { dueLabel } from "@/lib/utils";
import type { AchievementId, VerificationEvidence, VerificationResult } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { VerificationModal } from "@/components/flow/verification-modal";

export function AssignmentDetailView() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askVerify, setAskVerify] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const assignment = state.assignments.find((a) => a.id === id);

  // Persisted verification — derived from the assignment so it survives a reload.
  const isVerified = assignment?.verification != null;
  const days = useMemo(() => (assignment ? daysUntil(assignment.due) : 0), [assignment]);

  const targetsForAssignment = useMemo(
    () => state.dailyTargets.filter((t) => t.assignmentId === id),
    [state.dailyTargets, id],
  );

  if (!assignment) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-muted">Assignment not found.</p>
        <Link href="/assignments" className="mt-3 inline-block">
          <Button variant="outline">Back to assignments</Button>
        </Link>
      </Card>
    );
  }

  const deleteAssignment = () => {
    dispatch({ type: "DELETE_ASSIGNMENT", id: assignment.id });
    router.push("/assignments");
  };

  const toggleTask = (taskId: string, currentStatus: string | undefined) => {
    const completing = currentStatus !== "completed";
    const lastOne =
      completing && assignment.tasks.every((t) => t.id === taskId || t.status === "completed");
    dispatch({
      type: "SET_TASK_COMPLETED",
      assignmentId: assignment.id,
      taskId: taskId as never,
      completed: completing,
    });
    if (lastOne) setAskVerify(true);
  };
  const onVerified = (result: VerificationResult, evidence: VerificationEvidence) => {
    dispatch({
      type: "RECORD_ASSIGNMENT_VERIFICATION",
      assignmentId: assignment.id,
      record: {
        score: result.total,
        max: result.max,
        verdict: result.verdict.kind,
        layers: result.layers,
        at: new Date().toISOString(),
        evidence,
      },
    });
    if (result.total >= 50) dispatch({ type: "ADD_XP", amount: 50 });
    if (result.total >= 80)
      dispatch({ type: "UNLOCK_ACHIEVEMENT", id: "verification-pro" as AchievementId });
    setVerifyOpen(false);
  };

  const undoLastTask = () => {
    const lastDone = [...assignment.tasks].reverse().find((t) => t.status === "completed");
    if (!lastDone) return;
    dispatch({
      type: "UPDATE_ASSIGNMENT",
      id: assignment.id,
      patch: { verification: null },
    });
  };

  const isComplete = assignment.progressPct >= 100;
  const doneCount = assignment.tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/assignments" className="text-sm font-bold text-calm-blue hover:underline">
          &larr; All assignments
        </Link>
        {!isComplete && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge tone="primary">{assignment.code}</Badge>
            <h1 className="text-2xl font-extrabold text-ink">{assignment.title}</h1>
          </div>
        )}
      </header>

      {isComplete ? (
        <Card aria-labelledby="complete-title" tone="success" className="text-center">
          <PartyPopper className="mx-auto size-10 text-sage" aria-hidden="true" />
          <h2 id="complete-title" className="mt-3 text-lg font-bold text-ink">
            {assignment.title} — all done!
          </h2>
          <p className="mt-1 text-sm text-muted">
            Every sub-task is complete. Great work — you earned your XP today.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {assignment.tasks.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-calm-blue-light px-3 py-1 text-xs font-semibold text-calm-blue"
              >
                {t.question ? `Q${t.question}` : t.title}
              </span>
            ))}
          </div>
          {isVerified ? (
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-sage-light px-3 py-1.5 text-xs font-bold text-sage">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Verified ✓ · +50 bonus claimed
            </p>
          ) : (
            <Button
              variant="outline"
              size="full"
              className="mt-5"
              icon={<ShieldCheck className="size-4" aria-hidden="true" />}
              onClick={() => setVerifyOpen(true)}
            >
              Verify my work
            </Button>
          )}
          <Button
            size="full"
            className="mt-3"
            icon={<Pencil className="size-4" aria-hidden="true" />}
            onClick={() => router.push(`/assignments/${assignment.id}/edit`)}
          >
            Edit assignment
          </Button>
          <Button
            variant="ghost"
            size="full"
            className="mt-2"
            icon={<Undo2 className="size-4" aria-hidden="true" />}
            onClick={undoLastTask}
          >
            Undo a step
          </Button>
        </Card>
      ) : (
        <>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-calm-blue">{assignment.progressPct}%</span>
              <div className="flex gap-2">
                <Link href={`/assignments/${assignment.id}/edit`}>
                  <Button variant="outline" size="sm" icon={<Pencil className="size-4" aria-hidden="true" />}>
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
            <Progress value={assignment.progressPct} label={`Progress of ${assignment.title}`} tone="primary" />
            <div className="flex items-center gap-2" aria-label="Milestones">
              {[25, 50, 75, 100].map((m) => (
                <span
                  key={m}
                  title={`${m}% milestone ${assignment.progressPct >= m ? "reached" : "not yet reached"}`}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                    assignment.progressPct >= m
                      ? "bg-sage-light text-sage"
                      : "bg-line/40 text-muted"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${assignment.progressPct >= m ? "bg-sage" : "bg-muted"}`}
                  />
                  {m}%
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden="true" />
                {days <= 0 ? "Past due" : `${days} day${days > 1 ? "s" : ""} left`} · Due {dueLabel(assignment.due)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-4" aria-hidden="true" />
                {doneCount}/{assignment.tasks.length} sub-tasks done
              </span>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-ink">Sub-tasks</h2>
            <p className="mt-1 text-sm text-muted">Check each off as you complete it — progress updates live. Tick the last one and you'll be asked to verify your work.</p>
            <ul className="mt-3 grid gap-2">
              {assignment.tasks.map((task, i) => {
                const done = task.status === "completed";
                return (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${done ? "border-sage/40 bg-sage-light/20" : "border-line bg-canvas/40"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id, task.status)}
                      aria-label={done ? `Mark question ${task.question ?? String.fromCharCode(65 + i)} as incomplete` : `Mark question ${task.question ?? String.fromCharCode(65 + i)} as complete`}
                      aria-pressed={done}
                      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors cursor-pointer ${done ? "border-sage bg-sage text-white" : "border-line bg-surface text-transparent hover:border-calm-blue"}`}
                    >
                      {done && <CheckCircle2 className="size-4" aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-semibold ${done ? "text-muted line-through" : "text-ink"}`}>
                        {task.question ? (
                          <>
                            <span className="mr-1.5 text-calm-blue">{task.question}</span>
                            {task.title}
                          </>
                        ) : (
                          <>
                            {String.fromCharCode(65 + i)}. {task.title}
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-muted">{task.estMinutes}m</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-calm-blue/30">
              <h3 className="text-sm font-bold text-ink">FlowCite — Reference Builder</h3>
              <p className="mt-1 text-xs text-muted">Build and save citations for this assignment.</p>
              <Link
                href="/flowcite"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-calm-blue"
              >
                <BookOpenCheck className="size-4" aria-hidden="true" />
                Open FlowCite
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            </Card>
            <Card className="border-sage/30">
              <h3 className="text-sm font-bold text-ink">Verify your work</h3>
              <p className="mt-1 text-xs text-muted">Start a daily target and return to check in — it&apos;ll score your progress automatically.</p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-sage"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Go to dashboard
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            </Card>
          </div>

          {targetsForAssignment.length > 0 && (
            <Card>
              <h2 className="font-bold text-ink">Upcoming targets</h2>
              <ul className="mt-3 grid gap-2">
                {targetsForAssignment
                  .filter((t) => t.status !== "completed")
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-xl border border-line bg-canvas/40 px-3 py-2 text-sm">
                      <span className="text-ink">{t.label}</span>
                      <span className="text-xs font-semibold text-muted">{t.date}</span>
                    </li>
                  ))}
              </ul>
              <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-calm-blue">
                View all on dashboard →
              </Link>
            </Card>
          )}

          <Card className="border-peach/40">
            <h2 className="font-bold text-ink">Danger zone</h2>
            <p className="mt-1 text-sm text-muted">
              Deleting this assignment will also remove all its daily targets and support messages.
            </p>
            {confirmDelete ? (
              <div className="mt-3 inline-flex items-center gap-2">
                <DeleteConfirm title={assignment.title} onConfirm={deleteAssignment} onCancel={() => setConfirmDelete(false)} />
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                icon={<Trash2 className="size-4" aria-hidden="true" />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete assignment
              </Button>
            )}
          </Card>
        </>
      )}

      <Modal open={askVerify} onClose={() => setAskVerify(false)} title="All sub-tasks complete!">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-calm-blue-light text-calm-blue">
            <ShieldCheck className="size-8" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold text-ink">{assignment.title} is all ticked off.</p>
          <p className="text-sm text-muted">
            Want to run a quick verification of this work? It takes a few seconds and can add a{" "}
            <strong className="text-sage">+50 verified bonus</strong>.
          </p>
          <Button
            size="full"
            icon={<ShieldCheck className="size-4" aria-hidden="true" />}
            onClick={() => {
              setAskVerify(false);
              setVerifyOpen(true);
            }}
          >
            Yes, verify my work
          </Button>
          <Button variant="ghost" size="full" onClick={() => setAskVerify(false)}>
            No, we can skip verification
          </Button>
        </div>
      </Modal>

      <VerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={onVerified}
        mode="completion"
        context={{
          code: assignment.code,
          text: `${assignment.title}. ${assignment.tasks.map((t) => t.title).join(". ")}`,
        }}
      />
    </div>
  );
}