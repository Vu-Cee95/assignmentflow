"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, NotebookPen, Pencil, Plus, RefreshCw, Trash2, CalendarClock, ListChecks } from "lucide-react";
import { useApp } from "@/lib/store";
import { buildDailyPlan } from "@/lib/domain/state";
import type { Assignment, AssignmentId } from "@/lib/domain/types";
import { dueLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { useState } from "react";

export function AssignmentsView() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<AssignmentId | null>(null);

  const assignments = state.assignments;

  const postsFor = (code: string, title: string) =>
    state.supportMessages.filter((m) => m.moduleCode === code && m.assignmentTitle === title).length;

  const viewWall = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({ type: "SET_ACTIVE_ASSIGNMENT", id: id as never });
    router.push("/social");
  };

  const deleteAssignment = (id: AssignmentId) => {
    dispatch({ type: "DELETE_ASSIGNMENT", id });
    setConfirmDeleteId(null);
  };

  /** Re-generates daily steps for an assignment that still has open work but no planned days left. */
  const replan = (a: Assignment) => {
    const openTasks = a.tasks.filter((t) => t.status !== "completed");
    const targets = buildDailyPlan(openTasks, a.id, a.due, 1);
    if (targets.length > 0) dispatch({ type: "ADD_DAILY_TARGETS", targets });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Assignments</h1>
          <p className="text-sm text-muted">Your work, broken into gentle daily steps.</p>
        </div>
        <Link href="/assignments/create">
          <Button icon={<Plus className="size-4" aria-hidden="true" />}>New assignment</Button>
        </Link>
      </header>

      {assignments.length === 0 ? (
        <Card className="text-center py-10">
          <NotebookPen className="mx-auto size-10 text-calm-blue" aria-hidden="true" />
          <h2 className="mt-3 font-bold text-ink">Nothing here yet</h2>
          <p className="mt-1 text-sm text-muted">Add your first assignment and we&apos;ll carve it into steps.</p>
          <Link href="/assignments/create" className="mt-4 inline-block">
            <Button icon={<Plus className="size-4" aria-hidden="true" />}>Add an assignment</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((a) => {
            const posts = postsFor(a.code, a.title);
            const openTasks = a.tasks.filter((t) => t.status !== "completed").length;
            const openTargets = state.dailyTargets.filter(
              (t) => t.assignmentId === a.id && t.status !== "completed"
            ).length;
            const canReplan = openTasks > 0 && openTargets === 0;
            return (
              <Card
                key={a.id}
                className="cursor-pointer transition-colors hover:border-calm-blue/40 hover:bg-calm-blue-light/20"
                onClick={() => router.push(`/assignments/${a.id}`)}
              >
                <CardHeader>
                  <div>
                    <Badge tone="primary">{a.code}</Badge>
                    <CardTitle className="mt-2">{a.title}</CardTitle>
                  </div>
                  <span className="text-2xl font-extrabold text-calm-blue">{a.progressPct}%</span>
                </CardHeader>
                <Progress value={a.progressPct} label={`Progress of ${a.title}`} tone="primary" />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    {dueLabel(a.due)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="size-4" aria-hidden="true" />
                    {a.tasks.length} steps planned
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {posts} posts
                  </span>
                </div>
                {canReplan && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      replan(a);
                    }}
                    aria-label={`Re-plan daily steps for ${a.title} (${openTasks} tasks left)`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-calm-blue/30 bg-calm-blue-light/40 px-3 py-2 text-xs font-bold text-calm-blue transition-colors hover:bg-calm-blue-light cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Re-plan daily steps · {openTasks} task{openTasks === 1 ? "" : "s"} left
                  </button>
                )}
                <div className="mt-3 flex items-center gap-1">
                  <Tooltip label="Edit">
                    <Link
                      href={`/assignments/${a.id}/edit`}
                      aria-label={`Edit ${a.title}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center rounded-full px-2.5 py-1.5 text-muted transition-colors hover:bg-calm-blue-light hover:text-calm-blue cursor-pointer"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                  </Tooltip>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <Tooltip label="Visit wall">
                      <button
                        type="button"
                        onClick={(e) => viewWall(e, a.id)}
                        aria-label={`Visit the wall for ${a.title}`}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-calm-blue transition-colors hover:bg-calm-blue-light cursor-pointer"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        {posts > 0 && <span>{posts}</span>}
                      </button>
                    </Tooltip>
                    {confirmDeleteId === a.id ? (
                      <DeleteConfirm
                        title={a.title}
                        onConfirm={() => deleteAssignment(a.id)}
                        onCancel={() => setConfirmDeleteId(null)}
                      />
                    ) : (
                      <Tooltip label="Delete">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(a.id); }}
                          aria-label={`Delete ${a.title}`}
                          className="inline-flex items-center rounded-full px-2.5 py-1.5 text-muted transition-colors hover:bg-peach-light hover:text-peach cursor-pointer"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    )}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}