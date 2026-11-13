import type {
  AppAction,
  AppState,
  Assignment,
  AssignmentId,
  AssignmentTask,
  Comment,
  CommentId,
  DailyTarget,
  TargetId,
  TaskId,
} from "@/lib/domain/types";
import {
  mockAssignments,
  mockComments,
  mockDailyTargets,
  mockReferences,
  mockRememberedAssignments,
  mockRewards,
  mockSupportMessages,
} from "@/lib/data/mock";
import { uid } from "@/lib/utils";

export const XP_LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 8000, 12000] as const;

export function levelFor(xp: number): number {
  let level = 1;
  for (const tresh of XP_LEVEL_THRESHOLDS) {
    if (xp >= tresh) level = XP_LEVEL_THRESHOLDS.indexOf(tresh) + 1;
  }
  return level;
}

/** XP required to reach the next level above `xp`. */
export function xpIntoLevel(xp: number): { level: number; current: number; next: number; pct: number } {
  const idx = Math.min(XP_LEVEL_THRESHOLDS.length - 1, levelFor(xp) - 1);
  const current = XP_LEVEL_THRESHOLDS[idx] ?? 0;
  const next = XP_LEVEL_THRESHOLDS[idx + 1] ?? current + 1000;
  const pct = ((xp - current) / (next - current)) * 100;
  return { level: idx + 1, current, next, pct };
}

export function createInitialState(): AppState {
  return {
    user: null,
    isAuthenticated: false,
    onboardingComplete: false,
    assignments: [],
    activeAssignmentId: null,
    activeTargetId: null,
    dailyTargets: [],
    rewards: [],
    redeemedRewardIds: [],
    supportMessages: [],
    heartedMessageIds: [],
    references: [],
    rememberedAssignments: [],
    comments: [],
    commentSavedIds: [],
    bookmarkedMessageIds: [],
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface TargetWithMeta extends DailyTarget {
  assignmentTitle: string;
  assignmentCode: string;
}

export function todayTarget(state: AppState): TargetWithMeta | null {
  let target = state.dailyTargets.find(
    (d) => d.date === todayIso() && d.status !== "completed"
  );
  // A rolled-over / unstarted target still keeps the loop alive — show the
  // earliest open one so the student always has a gentle next step.
  if (!target) {
    const open = [...state.dailyTargets]
      .filter((d) => d.status !== "completed")
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    target = open[0];
  }
  if (!target) return null;
  const assignment = state.assignments.find((a) => a.id === target.assignmentId);
  return {
    ...target,
    assignmentTitle: assignment?.title ?? "Assignment",
    assignmentCode: assignment?.code ?? "",
  };
}

export function todayCompleted(state: AppState): DailyTarget | null {
  return state.dailyTargets.find((d) => d.date === todayIso() && d.status === "completed") ?? null;
}

export function dailyStreak(state: AppState): number {
  const completedDates = new Set(
    state.dailyTargets.filter((d) => d.status === "completed").map((d) => d.date)
  );
  const today = todayIso();
  let streak = 0;
  for (let i = 0; ; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (date === today && completedDates.has(today)) {
      streak += 1;
      continue;
    }
    if (date === today) {
      continue; // today not yet completed doesn't break a streak
    }
    if (completedDates.has(date)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Streak with a single "shield" rescue: if the most recent day was missed but a
 * 2+ day streak was running, the shield banks that day too.
 */
export function streakWithShield(state: AppState): { streak: number; shieldUsed: boolean } {
  const completedDates = new Set(
    state.dailyTargets.filter((d) => d.status === "completed").map((d) => d.date)
  );
  const today = todayIso();
  let streak = 0;
  let shieldUsed = false;
  for (let i = 0; ; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (date === today) {
      if (completedDates.has(today)) streak += 1;
      continue;
    }
    if (completedDates.has(date)) {
      streak += 1;
      continue;
    }
    if (!shieldUsed && streak >= 2) {
      shieldUsed = true;
      streak += 1;
      continue;
    }
    break;
  }
  return { streak, shieldUsed };
}

/** True when no target was completed yesterday (used for the comeback bonus). */
export function missedYesterday(state: AppState): boolean {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return !state.dailyTargets.some((d) => d.date === yesterday && d.status === "completed");
}

export function unredeemed(state: AppState) {
  return state.rewards.filter((r) => !state.redeemedRewardIds.includes(r.id));
}

export function pointsBalance(state: AppState): number {
  const earned = state.dailyTargets.reduce((sum, d) => sum + d.xpEarned, 0);
  const spent = state.rewards
    .filter((r) => state.redeemedRewardIds.includes(r.id))
    .reduce((sum, r) => sum + r.cost, 0);
  return earned - spent;
}

export function earnedReferenceCount(state: AppState): number {
  return state.references.length;
}

/** Calendar days remaining until the due date (min 1). */
export function daysUntil(due: string): number {
  const dueT = new Date(`${due}T23:59:59`).getTime();
  const now = Date.now();
  return Math.max(1, Math.round((dueT - now) / 86400000));
}

/** Computes assignment progress % from task statuses. */
function recomputeProgress(assignment: Assignment): number {
  if (assignment.tasks.length === 0) return 0;
  const done = assignment.tasks.filter((t) => t.status === "completed").length;
  return Math.min(100, Math.round((done / assignment.tasks.length) * 100));
}

/**
 * Spreads pending tasks across days until the deadline, producing DailyTargets.
 * `pace` is the number of sub-tasks worked per day (1–3); targets have a 2-day
 * buffer before the deadline, so binCount caps at the days actually available.
 */
export function buildDailyPlan(
  tasks: AssignmentTask[],
  assignmentId: AssignmentId,
  due: string,
  pace = 1,
): DailyTarget[] {
  const days = Math.max(1, daysUntil(due) - 2);
  if (tasks.length === 0) return [];
  const desiredBins = Math.ceil(tasks.length / Math.max(1, pace));
  const binCount = Math.min(desiredBins, Math.min(tasks.length, days));
  const bins: AssignmentTask[][] = Array.from({ length: binCount }, () => []);
  tasks.forEach((task, i) => bins[i % binCount]!.push(task));
  return bins
    .filter((b) => b.length > 0)
    .map((bin, i) => {
      const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      const first = bin[0]!;
      const label = bin.length === 1 ? first.title : `${first.title} + ${bin.length - 1} more`;
      const minutes = bin.reduce((s, t) => s + t.estMinutes, 0);
      return {
        id: uid("tg") as TargetId,
        assignmentId,
        taskId: first.id,
        label,
        minutes,
        date,
        status: "pending" as const,
        verificationScore: null,
        xpEarned: 0,
      };
    });
}

function completeTarget(state: AppState, targetId: string, xp: number, score: number | null): AppState {
  const target = state.dailyTargets.find((d) => d.id === targetId);
  if (!target) return state;
  const assignment = state.assignments.find((a) => a.id === target.assignmentId);
  let updatedTasks = assignment?.tasks;
  if (assignment) {
    updatedTasks = assignment.tasks.map((t) =>
      t.id === target.taskId ? { ...t, status: "completed" as const } : t
    );
  }
  const progressPct = assignment
    ? recomputeProgress({ ...assignment, tasks: updatedTasks! })
    : 0;
  return {
    ...state,
    user: state.user && xp > 0 ? { ...state.user, xp: state.user.xp + xp } : state.user,
    dailyTargets: state.dailyTargets.map((d) =>
      d.id === targetId
        ? { ...d, status: "completed" as const, xpEarned: d.xpEarned + xp, verificationScore: score }
        : d
    ),
    assignments: state.assignments.map((a) =>
      assignment && a.id === assignment.id
        ? { ...a, progressPct: progressPct ?? a.progressPct, tasks: updatedTasks ?? a.tasks }
        : a
    ),
  };
}

function setTaskCompleted(state: AppState, assignmentId: AssignmentId, taskId: TaskId, completed: boolean): AppState {
  return {
    ...state,
    assignments: state.assignments.map((a) => {
      if (a.id !== assignmentId) return a;
      const tasks = a.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const status: "completed" | "pending" = completed ? "completed" : "pending";
        return { ...t, status };
      });
      return { ...a, tasks, progressPct: recomputeProgress({ ...a, tasks }) };
    }),
  };
}

/** Returns the comment id plus every descendant (by parent chain). */
function commentWithDescendants(comments: Comment[], id: CommentId): Set<CommentId> {
  const ids = new Set<CommentId>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of comments) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOGIN": {
      const withSeed = { ...createInitialState(), ...state };
      return {
        ...withSeed,
        user: action.user,
        isAuthenticated: true,
        assignments: mockAssignments,
        dailyTargets: mockDailyTargets(),
        rewards: mockRewards,
        supportMessages: mockSupportMessages,
        references: mockReferences,
        rememberedAssignments: mockRememberedAssignments,
        comments: mockComments,
      };
    }

    case "LOGOUT":
      return createInitialState();

    case "COMPLETE_ONBOARDING":
      return { ...state, onboardingComplete: true };

    case "SET_ACTIVE_ASSIGNMENT":
      return { ...state, activeAssignmentId: action.id };

    case "ADD_ASSIGNMENT":
      return { ...state, assignments: [...state.assignments, action.assignment] };

    case "UPDATE_ASSIGNMENT":
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };

    case "DELETE_ASSIGNMENT": {
      const deleted = state.assignments.find((a) => a.id === action.id);
      const codeTitlePairs = deleted
        ? new Set([`${deleted.code}·${deleted.title}`])
        : new Set<string>();
      const targetIds = new Set(
        state.dailyTargets.filter((d) => d.assignmentId === action.id).map((d) => d.id)
      );
      const removedMsgIds = new Set(
        state.supportMessages
          .filter((m) => codeTitlePairs.has(`${m.moduleCode}·${m.assignmentTitle}`))
          .map((m) => m.id)
      );
      const removedCommentIds = new Set(
        state.comments.filter((c) => removedMsgIds.has(c.postId)).map((c) => c.id)
      );
      return {
        ...state,
        assignments: state.assignments.filter((a) => a.id !== action.id),
        dailyTargets: state.dailyTargets.filter((d) => d.assignmentId !== action.id),
        activeAssignmentId: state.activeAssignmentId === action.id ? null : state.activeAssignmentId,
        activeTargetId: state.activeTargetId && targetIds.has(state.activeTargetId) ? null : state.activeTargetId,
        supportMessages: state.supportMessages.filter((m) => !removedMsgIds.has(m.id)),
        comments: state.comments.filter((c) => !removedCommentIds.has(c.id)),
        heartedMessageIds: state.heartedMessageIds.filter((id) => !removedMsgIds.has(id)),
        bookmarkedMessageIds: state.bookmarkedMessageIds.filter((id) => !removedMsgIds.has(id)),
        commentSavedIds: state.commentSavedIds.filter((id) => !removedCommentIds.has(id)),
      };
    }

    case "SET_TASK_COMPLETED":
      return setTaskCompleted(state, action.assignmentId, action.taskId, action.completed);

    case "ADD_DAILY_TARGETS":
      return { ...state, dailyTargets: [...state.dailyTargets, ...action.targets] };

    case "START_TARGET":
      return {
        ...state,
        activeTargetId: action.id,
        dailyTargets: state.dailyTargets.map((d) =>
          d.id === action.id ? { ...d, status: "in_progress" as const } : d
        ),
      };

    case "RETURN_CHECK_IN": {
      const target = state.dailyTargets.find((d) => d.id === action.targetId);
      if (!target) return state;

      if (action.outcome === "finished") {
        const assignment = state.assignments.find((a) => a.id === target.assignmentId);
        let updatedTasks = assignment?.tasks;
        if (assignment) {
          updatedTasks = assignment.tasks.map((t) =>
            t.id === target.taskId ? { ...t, status: "completed" as const } : t
          );
        }
        const progressPct = assignment
          ? recomputeProgress({ ...assignment, tasks: updatedTasks! })
          : 0;
        const comeback = missedYesterday(state) ? 100 : 0;
        const totalXp = 150 + comeback;
        return {
          ...state,
          user: state.user ? { ...state.user, xp: state.user.xp + totalXp } : state.user,
          activeTargetId: null,
          dailyTargets: state.dailyTargets.map((d) =>
            d.id === action.targetId
              ? { ...d, status: "completed" as const, xpEarned: d.xpEarned + totalXp }
              : d
          ),
          assignments: assignment
            ? state.assignments.map((a) =>
                a.id === assignment.id
                  ? { ...a, progressPct: progressPct ?? a.progressPct, tasks: updatedTasks ?? a.tasks }
                  : a
              )
            : state.assignments,
        };
      }

      const xp = action.outcome === "progress" ? 50 : 0;
      const nextDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const rolledStatus: "pending" | "in_progress" =
        action.outcome === "progress" ? "in_progress" : "pending";
      return {
        ...state,
        user: state.user && xp > 0 ? { ...state.user, xp: state.user.xp + xp } : state.user,
        activeTargetId: null,
        dailyTargets: state.dailyTargets.map((d) =>
          d.id === action.targetId
            ? { ...d, status: rolledStatus, date: nextDate, verificationScore: null, verification: undefined }
            : d
        ),
      };
    }

    case "ADD_XP":
      return {
        ...state,
        user: state.user ? { ...state.user, xp: state.user.xp + action.amount } : state.user,
      };

    case "COMPLETE_TARGET":
      return completeTarget(state, action.targetId, action.xp, action.score);

    case "ADD_REFERENCE":
      return { ...state, references: [...state.references, action.reference] };

    case "DELETE_REFERENCE":
      return { ...state, references: state.references.filter((r) => r.id !== action.id) };

    case "REDEEM_REWARD":
      return {
        ...state,
        redeemedRewardIds: [...state.redeemedRewardIds, action.id],
      };

    case "TOGGLE_HEART":
      return {
        ...state,
        heartedMessageIds: state.heartedMessageIds.includes(action.id)
          ? state.heartedMessageIds.filter((id) => id !== action.id)
          : [...state.heartedMessageIds, action.id],
        supportMessages: state.supportMessages.map((m) =>
          m.id === action.id
            ? {
                ...m,
                hearts: Math.max(0, (m.hearts ?? 0) + (state.heartedMessageIds.includes(action.id) ? -1 : 1)),
              }
            : m
        ),
      };

    case "TOGGLE_POST_BOOKMARK": {
      const has = state.bookmarkedMessageIds.includes(action.id);
      return {
        ...state,
        bookmarkedMessageIds: has
          ? state.bookmarkedMessageIds.filter((id) => id !== action.id)
          : [...state.bookmarkedMessageIds, action.id],
      };
    }

    case "ADD_SUPPORT_MESSAGE":
      return { ...state, supportMessages: [action.message, ...state.supportMessages] };

    case "UPDATE_SUPPORT_MESSAGE": {
      const trimmed = action.content.trim();
      if (!trimmed) return state;
      return {
        ...state,
        supportMessages: state.supportMessages.map((m) =>
          m.id === action.id ? { ...m, content: trimmed } : m
        ),
      };
    }

    case "ADD_COMMENT":
      return { ...state, comments: [action.comment, ...state.comments] };

    case "TOGGLE_COMMENT_LIKE":
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.id
            ? { ...c, likedByMe: !c.likedByMe, likes: c.likedByMe ? c.likes - 1 : c.likes + 1 }
            : c
        ),
      };

    case "TOGGLE_COMMENT_BOOKMARK": {
      const has = state.commentSavedIds.includes(action.id);
      return {
        ...state,
        commentSavedIds: has
          ? state.commentSavedIds.filter((id) => id !== action.id)
          : [...state.commentSavedIds, action.id],
      };
    }

    case "UPDATE_COMMENT": {
      const trimmed = action.content.trim();
      if (!trimmed) return state;
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.id ? { ...c, content: trimmed, editedAt: new Date().toISOString() } : c
        ),
      };
    }

    case "DELETE_COMMENT": {
      const doomed = commentWithDescendants(state.comments, action.id);
      return {
        ...state,
        comments: state.comments.filter((c) => !doomed.has(c.id)),
        commentSavedIds: state.commentSavedIds.filter((id) => !doomed.has(id)),
      };
    }

    case "DELETE_SUPPORT_MESSAGE": {
      const doomed = state.comments.filter((c) => c.postId === action.id).map((c) => c.id);
      const doomedSet = new Set(doomed);
      return {
        ...state,
        supportMessages: state.supportMessages.filter((m) => m.id !== action.id),
        comments: state.comments.filter((c) => c.postId !== action.id),
        heartedMessageIds: state.heartedMessageIds.filter((id) => id !== action.id),
        bookmarkedMessageIds: state.bookmarkedMessageIds.filter((id) => id !== action.id),
        commentSavedIds: state.commentSavedIds.filter((id) => !doomedSet.has(id)),
      };
    }

    case "REMEMBER_ASSIGNMENT": {
      const code = action.code.trim().toUpperCase();
      const title = action.title.trim();
      if (!code || !title) return state;
      const rest = state.rememberedAssignments.filter(
        (r) => r.code !== code || r.title !== title
      );
      return {
        ...state,
        rememberedAssignments: [
          { code, title, usedAt: new Date().toISOString() },
          ...rest,
        ].slice(0, 20),
      };
    }

    case "UPDATE_PREFERENCES":
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, preferences: { ...state.user.preferences, ...action.prefs } },
      };

    case "UNLOCK_ACHIEVEMENT":
      if (!state.user) return state;
      if (state.user.achievements.includes(action.id)) return state;
      return {
        ...state,
        user: { ...state.user, achievements: [...state.user.achievements, action.id] },
      };

    case "RECORD_TARGET_VERIFICATION":
      return {
        ...state,
        dailyTargets: state.dailyTargets.map((d) =>
          d.id === action.targetId
            ? { ...d, verification: action.record, verificationScore: action.record.score }
            : d
        ),
      };

    case "RECORD_ASSIGNMENT_VERIFICATION":
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.assignmentId ? { ...a, verification: action.record } : a
        ),
      };

    default:
      return state;
  }
}

export function selectActiveAssignmentId(state: AppState): AssignmentId | null {
  return state.activeAssignmentId;
}