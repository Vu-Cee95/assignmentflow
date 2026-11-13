/* Domain model for AssignmentFlow.
 * Design notes (architecture-designer):
 *  - Branded string ids keep entity references type-safe (typescript-pro).
 *  - Discriminated unions model the target lifecycle and verification result.
 *  - No `enum` values — const objects + `as const` instead.
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type AssignmentId = Brand<string, "AssignmentId">;
export type TaskId = Brand<string, "TaskId">;
export type TargetId = Brand<string, "TargetId">;
export type RewardId = Brand<string, "RewardId">;
export type MessageId = Brand<string, "MessageId">;
export type ReferenceId = Brand<string, "ReferenceId">;
export type AchievementId = Brand<string, "AchievementId">;
export type CommentId = Brand<string, "CommentId">;

export const TARGET_STATUSES = ["pending", "in_progress", "completed"] as const;
export type TargetStatus = (typeof TARGET_STATUSES)[number];

export const FONT_SIZES = [100, 125, 150] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const THEMES = ["default", "dark", "high-contrast"] as const;
export type Theme = (typeof THEMES)[number];

export const REWARD_CATEGORIES = [
  "data",
  "coffee",
  "printing",
  "stationery",
  "transport",
  "groceries",
] as const;
export type RewardCategory = (typeof REWARD_CATEGORIES)[number];

export const VERIFICATION_LAYERS = [
  "document",
  "keywords",
  "photo",
  "reflection",
  "buddy",
] as const;
export type VerificationLayer = (typeof VERIFICATION_LAYERS)[number];

export interface Preferences {
  fontSize: FontSize;
  theme: Theme;
  reducedMotion: boolean;
  /** Connected document (layer 1 verification), e.g. a Google Doc or Word file. */
  connectedDocument?: string;
  /** Opt into a study buddy confirming their sessions. */
  studyBuddy?: boolean;
  /** Master switch for gentle notifications (capped at 2/day, silent after 9 PM). */
  notificationsEnabled?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  achievements: AchievementId[];
  preferences: Preferences;
}

export interface AssignmentTask {
  id: TaskId;
  title: string;
  estMinutes: number;
  /** Question number shown to the student, e.g. "1.1" or "2.3". */
  question?: string;
  status?: "pending" | "completed";
}

export interface Assignment {
  id: AssignmentId;
  code: string;
  title: string;
  due: string; // ISO date
  progressPct: number;
  tasks: AssignmentTask[];
  /** Persisted verification result (completion mode — verified after all sub-tasks ticked off). */
  verification?: VerificationRecord | null;
}

export interface RememberedAssignment {
  code: string;
  title: string;
  usedAt: string; // ISO timestamp of last use
}

export interface DailyTarget {
  id: TargetId;
  assignmentId: AssignmentId;
  taskId: TaskId;
  label: string;
  minutes: number;
  date: string; // ISO yyyy-mm-dd
  status: TargetStatus;
  verificationScore: number | null;
  /** Persisted verification result (session mode — verified after a finished check-in). */
  verification?: VerificationRecord;
  xpEarned: number;
}

export interface Reward {
  id: RewardId;
  title: string;
  description: string;
  cost: number;
  category: RewardCategory;
}

export interface SupportMessage {
  id: MessageId;
  author: string;
  content: string;
  time: string; // ISO datetime
  /** Assignment group this post belongs to (module code + assignment title). */
  moduleCode: string;
  assignmentTitle: string;
  /** Heart (like) count on the post, including this viewer. */
  hearts?: number;
}

export interface Comment {
  id: CommentId;
  postId: MessageId;
  parentId: CommentId | null;
  author: string;
  content: string;
  time: string;
  editedAt?: string; // ISO datetime set when content is edited
  likes: number;
  likedByMe: boolean;
}

export interface Reference {
  id: ReferenceId;
  title: string;
  authors: string;
  year: string;
  source: string;
  pages?: string;
  doi?: string;
  /** Cite-type label — book / journal / website / … */
  kind?: string;
  /** Website, newspaper or report link */
  url?: string;
  /** Book / conference publisher (when separate from the source container) */
  publisher?: string;
  /** Place of publication (books, Chicago style) */
  city?: string;
  /** e.g. "2nd" */
  edition?: string;
  /** Journal volume */
  volume?: string;
  /** Journal issue */
  issue?: string;
  /** Newspaper publication date or website accessed date */
  date?: string;
  /** Report number */
  reportNumber?: string;
  /** Thesis degree / type, e.g. "Master's thesis" */
  degree?: string;
  /** Thesis awarding institution */
  university?: string;
}

export interface UserUnlockables {
  streak: number;
  targetsCompleted: number;
  assignments: number;
  references: number;
  rewards: number;
  supportPosted: boolean;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  assignments: Assignment[];
  activeAssignmentId: AssignmentId | null;
  activeTargetId: TargetId | null;
  dailyTargets: DailyTarget[];
  rewards: Reward[];
  redeemedRewardIds: RewardId[];
  supportMessages: SupportMessage[];
  heartedMessageIds: MessageId[];
  references: Reference[];
  /** Assignment inputs the user has entered before — powers autofill. */
  rememberedAssignments: RememberedAssignment[];
  /** Threaded comments on support wall posts. */
  comments: Comment[];
  /** Bookmarked/saved comment ids. */
  commentSavedIds: CommentId[];
  /** Bookmarked/saved support post ids. */
  bookmarkedMessageIds: MessageId[];
}

/* ---- Check-in / verification data shapes ---- */

export interface CheckInResponses {
  feeling: "energised" | "ok" | "drained";
  progress: "stuck" | "wrapped-up" | "at-target";
  notes: string;
}

export interface LayerScore {
  layer: VerificationLayer;
  label: string;
  score: number;
  max: number;
}

export interface VerificationResult {
  total: number;
  max: number;
  verdict:
    | { kind: "verified" }
    | { kind: "self-reported"; eligibleForPremium: boolean };
  layers: LayerScore[];
}

/** What the student actually submitted during the verification run (persisted with the record). */
export interface VerificationEvidence {
  documentName: string | null;
  photoName: string | null;
  pastedText: string;
  reflection: string;
}

/**
 * A completed verification, stamped onto the daily target (session mode) or the
 * assignment (completion mode) so verified history survives a reload.
 */
export interface VerificationRecord {
  score: number;
  max: number;
  verdict: "verified" | "self-reported";
  layers: LayerScore[];
  /** ISO timestamp of when the verification was claimed. */
  at: string;
  evidence?: VerificationEvidence;
}

export const RETURN_OUTCOMES = ["finished", "progress", "not-yet"] as const;
export type ReturnOutcome = (typeof RETURN_OUTCOMES)[number];

export type AppAction =
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "SET_ACTIVE_ASSIGNMENT"; id: AssignmentId | null }
  | { type: "ADD_ASSIGNMENT"; assignment: Assignment }
  | { type: "UPDATE_ASSIGNMENT"; id: AssignmentId; patch: Partial<Pick<Assignment, "code" | "title" | "due">> & { tasks?: AssignmentTask[]; verification?: VerificationRecord | null } }
  | { type: "DELETE_ASSIGNMENT"; id: AssignmentId }
  | { type: "SET_TASK_COMPLETED"; assignmentId: AssignmentId; taskId: TaskId; completed: boolean }
  | { type: "ADD_DAILY_TARGETS"; targets: DailyTarget[] }
  | { type: "START_TARGET"; id: TargetId }
  | { type: "RETURN_CHECK_IN"; targetId: TargetId; outcome: ReturnOutcome }
  | { type: "ADD_XP"; amount: number }
  | { type: "COMPLETE_TARGET"; targetId: TargetId; xp: number; score: number | null }
  | { type: "ADD_REFERENCE"; reference: Reference }
  | { type: "DELETE_REFERENCE"; id: ReferenceId }
  | { type: "REDEEM_REWARD"; id: RewardId }
  | { type: "TOGGLE_HEART"; id: MessageId }
  | { type: "TOGGLE_POST_BOOKMARK"; id: MessageId }
  | { type: "ADD_SUPPORT_MESSAGE"; message: SupportMessage }
  | { type: "UPDATE_SUPPORT_MESSAGE"; id: MessageId; content: string }
  | { type: "ADD_COMMENT"; comment: Comment }
  | { type: "UPDATE_COMMENT"; id: CommentId; content: string }
  | { type: "DELETE_COMMENT"; id: CommentId }
  | { type: "DELETE_SUPPORT_MESSAGE"; id: MessageId }
  | { type: "TOGGLE_COMMENT_LIKE"; id: CommentId }
  | { type: "TOGGLE_COMMENT_BOOKMARK"; id: CommentId }
  | { type: "REMEMBER_ASSIGNMENT"; code: string; title: string }
  | { type: "UPDATE_PREFERENCES"; prefs: Partial<Preferences> }
  | { type: "UNLOCK_ACHIEVEMENT"; id: AchievementId }
  | { type: "RECORD_TARGET_VERIFICATION"; targetId: TargetId; record: VerificationRecord }
  | { type: "RECORD_ASSIGNMENT_VERIFICATION"; assignmentId: AssignmentId; record: VerificationRecord };