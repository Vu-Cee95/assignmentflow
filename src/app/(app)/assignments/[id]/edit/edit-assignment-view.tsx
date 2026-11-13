"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { AssignmentTask, TaskId } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Field, TextInput } from "@/components/ui/field";
import { uid } from "@/lib/utils";
import { useState } from "react";

export function EditAssignmentView() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const router = useRouter();

  const assignment = state.assignments.find((a) => a.id === id);

  const [code, setCode] = useState(assignment?.code ?? "");
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [due, setDue] = useState(() => {
    if (!assignment) return "";
    return new Date(assignment.due).toISOString().slice(0, 10);
  });
  const [tasks, setTasks] = useState<AssignmentTask[]>(assignment?.tasks ?? []);

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

  const updateTask = (taskId: string, patch: Partial<AssignmentTask>) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );

  const addTask = () =>
    setTasks((prev) => [
      ...prev,
      { id: uid("tk") as TaskId, title: "New step", estMinutes: 30, status: "pending" },
    ]);

  const removeTask = (taskId: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  const canSave =
    code.trim().length > 0 &&
    title.trim().length > 0 &&
    due.length > 0 &&
    tasks.length > 0;

  const save = () => {
    if (!canSave) return;
    dispatch({
      type: "UPDATE_ASSIGNMENT",
      id: assignment.id,
      patch: {
        code: code.trim().toUpperCase().slice(0, 10),
        title: title.trim(),
        due: new Date(due).toISOString(),
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          estMinutes: t.estMinutes,
          status: t.status,
        })),
      },
    });
    router.push(`/assignments/${assignment.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href={`/assignments/${assignment.id}`} className="text-sm font-bold text-calm-blue hover:underline">
          &larr; Back to assignment
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">Edit assignment</h1>
      </header>

      <Card className="space-y-4">
        <Field label="Module code" required>
          <TextInput
            id="edit-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={12}
          />
        </Field>
        <Field label="Assignment title" required>
          <TextInput
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Due date" required>
          <TextInput
            id="edit-due"
            type="date"
            value={due}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>
      </Card>

      <Card>
        <h2 className="font-bold text-ink">Step plan</h2>
        <p className="mt-1 text-sm text-muted">Rename tasks or change their time-boxes.</p>
        <ul className="mt-3 grid gap-3">
          {tasks.map((task, i) => (
            <li key={task.id} className="rounded-xl border border-line bg-canvas/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted">Step {i + 1}</span>
                <Tooltip label="Remove step">
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    aria-label={`Remove step ${i + 1}`}
                    className="rounded-lg p-1 text-peach hover:bg-peach-light cursor-pointer"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </Tooltip>
              </div>
              <input
                className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                aria-label={`Step ${i + 1} title`}
              />
              <label className="mt-2 block text-xs font-semibold text-muted">
                Minutes
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={task.estMinutes}
                  onChange={(e) =>
                    updateTask(task.id, {
                      estMinutes: Math.max(10, Number(e.target.value) || 10),
                    })
                  }
                  className="mt-1 w-28 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  aria-label={`Step ${i + 1} minutes`}
                />
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addTask}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-calm-blue cursor-pointer"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add a step
        </button>
      </Card>

      <div className="flex gap-3">
        <Link href={`/assignments/${assignment.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          className="flex-1"
          icon={<CalendarPlus className="size-4" aria-hidden="true" />}
          disabled={!canSave}
          onClick={save}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}