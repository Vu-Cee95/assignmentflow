import type {
  AchievementId,
  Assignment,
  AssignmentId,
  Comment,
  CommentId,
  DailyTarget,
  Reward,
  Reference,
  ReferenceId,
  RememberedAssignment,
  RewardId,
  SupportMessage,
  MessageId,
  TaskId,
  TargetId,
  User,
  UserUnlockables,
} from "@/lib/domain/types";

const a = (v: string) => v as AssignmentId;
const t = (v: string) => v as TaskId;
const g = (v: string) => v as TargetId;
const r = (v: string) => v as RewardId;
const rf = (v: string) => v as ReferenceId;
const m = (v: string) => v as MessageId;
const ach = (v: string) => v as AchievementId;
const cid = (v: string) => v as CommentId;

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const mockUser: User = {
  id: "u-thabo",
  name: "Thabo Nkosi",
  email: "thabo.nkosi@gmail.com",
  xp: 1840,
  streak: 6,
  achievements: [],
  preferences: {
    fontSize: 100,
    theme: "default",
    reducedMotion: false,
  },
};

const hcinAssign: Assignment = {
  id: a("hc6222-poe2"),
  code: "HCIN6222",
  title: "HCI POE Part 2",
  due: new Date(Date.now() + 11 * 86400000).toISOString(),
  progressPct: 33,
  tasks: [
    { id: t("t1"), question: "1.1", title: "Finalise UI sketches in Figma", estMinutes: 60, status: "completed" },
    { id: t("t2"), question: "1.2", title: "Build login and onboarding screens", estMinutes: 90, status: "completed" },
    { id: t("t3"), question: "1.3", title: "Wire up the dashboard flow", estMinutes: 75, status: "pending" },
    { id: t("t4"), question: "1.4", title: "Implement FlowCite reference builder", estMinutes: 75, status: "pending" },
    { id: t("t5"), question: "1.5", title: "Run usability test with 3 peers", estMinutes: 45, status: "pending" },
    { id: t("t6"), question: "1.6", title: "Finalise POE submission pack", estMinutes: 60, status: "pending" },
  ],
};

const progAssign: Assignment = {
  id: a("prog6221-a3"),
  code: "PROG6221",
  title: "Data Visualisation — Assignment 3",
  due: new Date(Date.now() + 21 * 86400000).toISOString(),
  progressPct: 0,
  tasks: [
    { id: t("pt1"), question: "2.1", title: "Outline the report structure", estMinutes: 30, status: "pending" },
    { id: t("pt2"), question: "2.2", title: "Build the interactive dashboard", estMinutes: 90, status: "pending" },
    { id: t("pt3"), question: "2.3", title: "Write methodology section", estMinutes: 45, status: "pending" },
  ],
};

export const mockAssignments: Assignment[] = [hcinAssign, progAssign];

/** Assignment inputs this user has previously entered — seeded so autofill works on first run. */
export const mockRememberedAssignments: RememberedAssignment[] = [
  { code: "HCIN6222", title: "HCI POE Part 2", usedAt: hcinAssign.due },
  { code: "PROG6221", title: "Data Visualisation — Assignment 3", usedAt: progAssign.due },
];

/** How many students have entered each module code, gathered from the community's input. */
export const COMMUNITY_MODULES: { code: string; students: number }[] = [
  { code: "HCIN6222", students: 214 },
  { code: "PROG6221", students: 168 },
  { code: "HUMA5001", students: 126 },
  { code: "STAT5111", students: 104 },
  { code: "MATH4101", students: 89 },
  { code: "WRSX5111", students: 57 },
  { code: "ACCT5102", students: 132 },
];

export function mockDailyTargets(): DailyTarget[] {
  const today = todayIso();
  const day = 86400000;
  const iso = (offset: number) =>
    new Date(Date.now() - offset * day).toISOString().slice(0, 10);
  return [
    // History for the journey map (completed).
    {
      id: g("d-6"),
      assignmentId: a("hc6222-poe2"),
      taskId: t("t2"),
      label: "Build login and onboarding screens",
      minutes: 90,
      date: iso(6),
      status: "completed",
      verificationScore: 86,
      xpEarned: 120,
    },
    {
      id: g("d-5"),
      assignmentId: a("hc6222-poe2"),
      taskId: t("t1"),
      label: "Finalise UI sketches in Figma",
      minutes: 60,
      date: iso(5),
      status: "completed",
      verificationScore: 91,
      xpEarned: 110,
    },
    {
      id: g("d-2"),
      assignmentId: a("prog6221-a3"),
      taskId: t("pt1"),
      label: "Outline the report structure",
      minutes: 30,
      date: iso(2),
      status: "completed",
      verificationScore: null,
      xpEarned: 60,
    },
    {
      id: g("d-1"),
      assignmentId: a("hc6222-poe2"),
      taskId: t("t1"),
      label: "Finalise UI sketches in Figma",
      minutes: 60,
      date: iso(1),
      status: "completed",
      verificationScore: 74,
      xpEarned: 100,
    },
    // Today's target (the demo flow starts here).
    {
      id: g("today-1"),
      assignmentId: a("hc6222-poe2"),
      taskId: t("t3"),
      label: "Wire up the dashboard flow",
      minutes: 75,
      date: today,
      status: "pending",
      verificationScore: null,
      xpEarned: 0,
    },
    // Tomorrow — planned.
    {
      id: g("tomorrow-1"),
      assignmentId: a("hc6222-poe2"),
      taskId: t("t4"),
      label: "Implement FlowCite reference builder",
      minutes: 75,
      date: new Date(Date.now() + day).toISOString().slice(0, 10),
      status: "pending",
      verificationScore: null,
      xpEarned: 0,
    },
  ];
}

export const mockRewards: Reward[] = [
  { id: r("rew-data"), title: "500MB data bundle", description: "Redeem for your favourite data network.", cost: 320, category: "data" },
  { id: r("rew-coffee"), title: "Campus catering voucher", description: "A meal or coffee discount at the campus cafeteria.", cost: 190, category: "coffee" },
  { id: r("rew-printing"), title: "50 print credits", description: "Free printing quota for your POE pack.", cost: 240, category: "printing" },
  { id: r("rew-stationery"), title: "Notebook + pens", description: "A pocket notebook and two pens.", cost: 280, category: "stationery" },
  { id: r("rew-transport"), title: "1 taxi trip", description: "One credited local taxi trip.", cost: 340, category: "transport" },
  { id: r("rew-groceries"), title: "R50 grocery voucher", description: "Voucher for a big-box retailer.", cost: 430, category: "groceries" },
];

export const mockSupportMessages: SupportMessage[] = [
  {
    id: m("msg-1"),
    author: "Anonymous",
    content: "Submitted my POE yesterday. Sleep first, panic later — it works.",
    time: new Date(Date.now() - 2 * 86400000).toISOString(),
    moduleCode: "HCIN6222",
    assignmentTitle: "HCI POE Part 2",
    hearts: 3,
  },
  {
    id: m("msg-2"),
    author: "Anonymous",
    content: "Does anyone else rewrite the same paragraph for an hour? Actual question.",
    time: new Date(Date.now() - 1 * 86400000).toISOString(),
    moduleCode: "PROG6221",
    assignmentTitle: "Data Visualisation — Assignment 3",
    hearts: 5,
  },
];

export const mockReferences: Reference[] = [
  {
    id: rf("ref-1"),
    title: "Designing User Experience",
    authors: "Nielsen, J.",
    year: "2012",
    source: "Nielsen Norman Group",
    pages: "12–34",
  },
  {
    id: rf("ref-2"),
    title: "The Design of Everyday Things (Revised)",
    authors: "Norman, D. A.",
    year: "2013",
    source: "Basic Books",
    pages: "9–58",
  },
];

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  xp: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: ach("first-step"), title: "First Step", description: "Complete your first daily target.", icon: "🚶", xp: 50 },
  { id: ach("streak-3"), title: "Three in a Row", description: "Complete a target 3 days in a row.", icon: "🔥", xp: 80 },
  { id: ach("streak-7"), title: "Full Week", description: "Complete a target 7 days in a row.", icon: "⭐", xp: 150 },
  { id: ach("plan-architect"), title: "Plan Architect", description: "Create and accept your first study plan.", icon: "🏗️", xp: 60 },
  { id: ach("flowcite-first"), title: "Citation Saver", description: "Save your first reference in FlowCite.", icon: "📚", xp: 70 },
  { id: ach("verification-pro"), title: "Verified", description: "Earn a verification score of 80+.", icon: "✅", xp: 100 },
  { id: ach("early-bird"), title: "Early Bird", description: "Complete a target before noon.", icon: "🌅", xp: 40 },
  { id: ach("support-hero"), title: "Support Hero", description: "Post a message on the Support Wall.", icon: "🤝", xp: 45 },
  { id: ach("roadrunner"), title: "Roadrunner", description: "Bank 1 000 XP in total.", icon: "🏃", xp: 120 },
  { id: ach("reward-claim"), title: "Reward Claimant", description: "Redeem your first reward.", icon: "🎁", xp: 90 },
];

export const COLLECTIVE_GOAL = 1000;
export const COLLECTIVE_ACHIEVED = 640;

export interface SuggestedSource {
  id: string;
  authors: string;
  year: string;
  title: string;
  source: string;
  kind: string;
  doi?: string;
}

export const FLOWCITE_SOURCES: SuggestedSource[] = [
  {
    id: "src-1",
    authors: "Nielsen, J.",
    year: "1995",
    title: "10 Usability Heuristics for User Interface Design",
    source: "Nielsen Norman Group",
    kind: "Semantic Scholar",
  },
  {
    id: "src-2",
    authors: "Norman, D. A.",
    year: "2013",
    title: "The Design of Everyday Things (Revised & Expanded)",
    source: "Basic Books, New York",
    kind: "Crossref",
  },
  {
    id: "src-3",
    authors: "Shneiderman, B.; Plaisant, C.",
    year: "2016",
    title: "Designing the User Interface: Strategies for Effective Interaction",
    source: "Pearson, Boston",
    kind: "Google Books",
  },
];

export const mockComments: Comment[] = [
  {
    id: cid("c-1"),
    postId: m("msg-1"),
    parentId: null,
    author: "Anonymous",
    content: "Congrats! What was the hardest part?",
    time: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    likes: 2,
    likedByMe: false,
  },
  {
    id: cid("c-2"),
    postId: m("msg-1"),
    parentId: cid("c-1"),
    author: "Anonymous",
    content: "Definitely the test section. Took three attempts.",
    time: new Date(Date.now() - 1.2 * 86400000).toISOString(),
    likes: 1,
    likedByMe: true,
  },
  {
    id: cid("c-3"),
    postId: m("msg-1"),
    parentId: null,
    author: "Thabo Nkosi",
    content: "Same here! Submitted mine at 3am. The sleep-first strategy actually works.",
    time: new Date(Date.now() - 1 * 86400000).toISOString(),
    likes: 4,
    likedByMe: false,
  },
  {
    id: cid("c-4"),
    postId: m("msg-2"),
    parentId: null,
    author: "Thabo Nkosi",
    content: "Every single paragraph. You're not alone.",
    time: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    likes: 3,
    likedByMe: false,
  },
  {
    id: cid("c-5"),
    postId: m("msg-2"),
    parentId: cid("c-4"),
    author: "Anonymous",
    content: "The struggle is real. I rewrote my intro four times.",
    time: new Date(Date.now() - 0.3 * 86400000).toISOString(),
    likes: 2,
    likedByMe: false,
  },
];

/* Unlockable achievements are derived from state, not persisted. */
export function derivedAchievements(u: UserUnlockables, unlocked: readonly AchievementId[]): AchievementId[] {
  const earned: AchievementId[] = [...unlocked];
  const add = (id: AchievementId, ok: boolean) => {
    if (ok && !earned.includes(id)) earned.push(id);
  };
  add(ach("first-step"), u.targetsCompleted >= 1);
  add(ach("streak-3"), u.streak >= 3);
  add(ach("streak-7"), u.streak >= 7);
  add(ach("plan-architect"), u.assignments >= 1);
  add(ach("flowcite-first"), u.references >= 1);
  add(ach("support-hero"), u.supportPosted);
  add(ach("reward-claim"), u.rewards >= 1);
  return earned;
}

export const reduceBy = <T,>(arr: T[], fn: (acc: number, item: T) => number, init = 0) =>
  arr.reduce(fn, init);