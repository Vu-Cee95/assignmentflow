# AssignmentFlow

> Gentle, daily steps. Verified progress. Real rest. A habit-first student wellness companion that breaks big POEs into small, non-negotiable daily targets.

AssignmentFlow is a **Next.js 16 (+ React 19 + Tailwind CSS v4)** prototype. It combines habit-forming mechanics (daily steps, streaks, XP), honest progress **verification** (a 100-point evidence scheme), a **FlowCite** research assistant (question → academic sources → Harvard references), gentle **planning** (it carves an assignment into time-boxed daily steps you can tweak), and **community + rewards** systems. The UI is WCAG 2.x AA-minded: it ships a skip link, focus traps, live regions, ARIA progressbars/tabs/radios/switches, a high-contrast theme, 100/125/150% font sizes and a reduced-motion mode.

---

## Feature map

| Screen | Route | What it shows / does |
|---|---|---|
| Sign in | `/login` | Demo auth (mock Google sign-in) |
| Onboarding | `/onboarding` | 3 motivational screens: mountain → stepping stones → puzzle ("small, daily, doable steps") |
| Dashboard | `/dashboard` | Today's step → **Start (Minimize & Work modal)** → persistent "Working on …" banner → **3-option return check-in** (finished +150 / some progress +50 / not yet 0) → **optional verification (+50)** → **Rest Reminder** with optional **Flow State** (+200) |
| Assignments | `/assignments` | Clickable cards with progress %, due labels, step count, post count, and icon-only **Edit / Wall / Delete** actions (delete swaps to fun-font ✓ / ✗ inline confirm; cascades to targets + messages) |
| Assignment detail | `/assignments/[id]` | Status-tracked sub-task checklist (live progress), upcoming targets, **FlowCite + verification links**, edit, and a **completion celebration screen** at 100% |
| Edit assignment | `/assignments/[id]/edit` | Inline edit form: module code, title, due date, and full task list editing (add/remove/rename/re-time) |
| Plan a new assignment | `/assignments/create` | 4-step wizard: details (with **community module auto-detect** — "N students have entered this module") → **assignment broken into sub-tasks, each with a question number (1.1, 1.2…)** → **daily plan from the deadline** (recommended-pace math: working days keep a 2-day buffer; "≈ N sub-questions/day, finishing ~date") → accept. An **Adjust daily pace** modal lets you re-plan at 1/2/3 sub-questions per day with live estimated completion dates. Accepting creates the assignment **and** its DailyTargets |
| FlowCite | `/flowcite` | Question analysis → matched sources → citation builder → references in **6 styles (APA 7 / MLA 9 / Chicago / AMA / IEEE / Harvard)**, saved to My References (style selector, bibliography + in-text copy, or delete with inline ✓ / ✗ confirm) |
| My Journey | `/journey` | Timeline of completed steps, **missed** steps, today's position, submission milestones, **14-day streak strip** and **25/50/75/100% milestone rails** per assignment |
| Achievements | `/achievements` | 10 badge catalogue, derived from real state |
| Social | `/social` | Study rooms, **same-assignment support wall** (posts auto-tagged to module code + title, filtered by your active assignment by default), hearts, **threaded comments with reply lines, likes & bookmarks**, community XP goal |
| Rewards | `/rewards` | XP balance, redeemable real-world rewards, **Flow Friday** weekly reward selection (funded by partnerships — never user data), eligibility rules |
| Settings | `/settings` | Theme (**Calm / Dark / High contrast**), text size, reduced motion, **connected document** (Google Docs / Word / pen & paper), **study buddy** toggle, **gentle notifications** (max 2/day, never after 9 PM), **export my data (JSON)** and **delete account**, sign out |

---

## Getting started

```bash
npm install        # reuses the existing node_modules; sometimes flaky, retry once
npm run dev -- --webpack -p 3210
```

> **Important — webpack, not Turbopack.** The Turbopack/SWC native binary on this machine fails to load (`next-swc.win32-x64-msvc.node is not a valid Win32 application`), so **all** commands must force the webpack bundler: `next dev --webpack`, `next build --webpack`.

Then open `http://localhost:3210`. Sign in with **"Continue with Google"** (mock) and complete onboarding. The demo user is *Thabo Nkosi*, mid-way through an HCI POE with a pending daily step and a 6-day streak.

### Demo flow (2 minutes)

1. Sign in, complete onboarding.
2. Dashboard → **Start today's target** → **Minimize & Work** → a persistent **"Working on …"** banner appears.
3. **Return & check in** → choose **Yes, I finished it** (+150) → **Run verification** (5 evidence layers) → **Claim XP & rest** (≥ 50 verified adds +50) → **I'm Done For Today** — or **I'm in the flow** to bank +200 and ride the next optional step.
4. Add a new assignment → generate, adjust the daily pace, and accept a step plan.
5. FlowCite: paste a question → **Analyse Question** → **Use this source** → pick the cite type (Book / Journal / Website / Newspaper / Report / Thesis / Conference paper) and the builder asks for exactly what that type needs (volumes & issues for journals, a pasted **website link** for websites, publishers, universities, report numbers, …) → **Generate Reference** → **Save to My References**, then **Copy** the bibliography or in-text citation in any of the 6 styles.

---

## Architecture

```
src/
  app/                      routes + server pages (metadata) that wrap client views
    (auth)/                 login, signup, onboarding
    (app)/                  dashboard, assignments(+create), flowcite, journey,
                            achievements, social, rewards, settings
  components/
    auth/  flow/  layout/  onboarding/  ui/     feature + design-system components
  lib/
    domain/types.ts         entity types, branded ids, action union, shared constants
    domain/state.ts         XP thresholds, selectors & the pure appReducer
    data/mock.ts            deterministic mocks (user, assignments, targets, rewards…)
    store.tsx               AppProvider + reducer + localStorage persistence
    references.ts           citation formatters — APA 7 / MLA 9 / Chicago / AMA / IEEE / Harvard
    utils.ts                cn, uid, date labels, timeAgo…
```

### Design decisions

- **Branded string IDs** (`AssignmentId`, `TargetId`, …) keep cross-entity references type-safe; unions & `as const` replace enums.
- **Pure reducer + selectors.** All state changes go through `appReducer`; the UI reads via selectors (`todayTarget`, `dailyStreak`, `pointsBalance`, …).
- **Deterministic mocks.** Screens are byte-for-byte reproducible for captures; dates are generated relative to "today".
- **Verification is a 100-point evidence scheme**: Google-Docs sync check (25) + **keyword match against the assignment's own title & sub-tasks** (25) + photo proof (20) + reflection quality (20) + study-buddy confirm (10). Before the run, the verify screen now collects real proof: **upload a PDF/Word document**, **add a photo** (with thumbnail preview), **paste the actual question or a snippet of your answer** — which is tokenised and matched term-by-term against key terms the same way FlowCite matches concepts — and optionally write a **reflection**. Each layer is then scored from what was actually submitted; skipped layers get a generous estimate, so an empty honest run still lands ≥ 50 → **Verified** (full XP + bonus XP + rewards eligible). ≥ 80 unlocks the `verification-pro` badge. The verify prompt triggers right when **all of an assignment's sub-tasks are ticked off** and after a finished working-session check-in on the dashboard.
- **Assignment module = the core engine.** Creating an assignment runs a 4-step wizard: details (module code with a **community auto-detect** count of other students who entered that module) → the assignment is **broken into sub-tasks/questions** (an editable list, each tagged with a question number like `1.1`; renaming/removing renumbers the rest) → a **daily plan is generated from the deadline** — working days = `daysUntil − 2` buffer, recommended pace = `min(3, ceil(subTasks / workingDays))`, and the plan summary shows the estimated completion date — with an **Adjust daily pace** modal (1/2/3 sub-questions per day, each option showing its own completion date) → accepted. Accepting creates the assignment **and** its DailyTargets, with the first target landing on **today** so the Start → Work → Check-In → Verify loop is immediately available. Completing a target (via the dashboard return check-in) or ticking a sub-task off recomputes the assignment's `progressPct` from real task statuses, and the detail page shows a **celebration screen** once it hits 100% — with question numbers shown on every task.
- **Return check-in loop (no punishment).** Starting a target opens a **"Minimize & Work"** modal, flips it to `in_progress`, and pins a **persistent working banner** on the dashboard. The return check-in is a three-option choice: **Yes, I finished it** (+150 XP, task marked complete), **I made some progress** (+50 XP, step rolls to tomorrow, stays `in_progress`), or **Not yet** (0 XP, step rolls to tomorrow) — partial and missed steps carry no shame, nothing is lost, and rolled-over steps keep showing on the dashboard so the loop never dead-ends.
- **XP economy**: a finished daily step banks **+150** (partial **+50**, not-yet 0); verification score ≥ 50 adds **+50 bonus**; choosing **Flow State** after the Rest Reminder banks **+200** for an optional extra step; returning after a missed day earns a **+100 comeback bonus**. Rewards cost XP from the same balance.
- **Streak Shield.** A 2+ day streak is protected by a shield: if the next day is missed, the shield banks it once automatically (`streakWithShield`). The dashboard shows the shield badge and a gentle come-back call-out when a miss would otherwise have broken the run.
- **Community module auto-detect.** In the assignment wizard, the module code field compares against a community dataset of module codes (seeded from other students' entries) and shows how many students have entered the same module — no reliance on the user's own text-box history.
- **Same-assignment community.** Support messages are tagged with the module code + title of the poster's active assignment. The support wall defaults to filtering messages from people on the same assignment; the assignments page shows post counts per assignment linking directly to that filtered wall.
- **Threaded comments (Facebook-style).** Every support post can be commented on; replies nest beneath parents with connecting left-hand thread lines. Each comment supports **like** (heart + count), **reply**, **bookmark/save**, **edit** (pencil – inline textarea, `(edited)` label; available to comment author or post owner), and **delete** (trash – swaps inline to fun-font ✓ / ✗ confirmation; same ownership rules). The post itself can be deleted by its author (cascades to all comments and bookmarks) or **edited in place** (pencil → inline textarea → save). Edit/delete icons sit on the far right of a post's action bar. Counts roll up as numbers on icon-only action bars.
- **Icon-only actions with counts.** Heart/comment/bookmark buttons show just the icon plus a numeric count when there is one (e.g. `♥ 3`, `💬 5`); no text labels. All actions keep descriptive `aria-label`s for screen readers.
- **Post bookmarking.** Any support post — including ones from other people — can be bookmarked (bookmark icon, filled when saved) via `bookmarkedMessageIds`.
- **Persistence**: state is saved to `localStorage` under `assignmentflow.state.v2` (user, onboarding, assignments, targets, rewards, messages, references, remembered module/title entries, active selections).
- **Accessibility**: skip link, focus-trapped modals (Escape/restore focus), live regions for analysis/verification, `role="progressbar"`, labelled tabs/radios/switches, 2 px focus-visible rings, reduced-motion + high-contrast + font-size modes controlled from Settings.
- **Themes.** The `--af-*` design tokens power three palettes (`default` = Calm, `dark`, `high-contrast`) applied via `html[data-theme]` from `store.tsx`. Dark palette keeps the same semantic tokens (calm-blue/sage/lavender/peach/sunny) so every screen works in all three themes. Recharts applies inline SVG colors, so the dashboard chart re-chromes itself per theme via a small `THEME_CHART_COLORS` mirror of the tokens.
- **Multi-style citations.** `references.ts` renders the same reference in APA 7, MLA 9, Chicago (author-date), AMA, IEEE and Harvard — bibliography plus an in-text form. FlowCite's builder asks for a **cite type** and shows **kind-aware fields**: the required container (publisher / journal / site name / newspaper / institution / proceedings / repository) plus each type's extras — a pasted **website link** and accessed date, journal **volume + issue**, book **edition + city**, report **number**, thesis **degree + university**, conference **publisher**. **Generate** stays disabled until the type's required details are filled, and the saved reference carries the extras into every style. **Page range** is only required for types that actually use pages.
- **Journey transparency.** The timeline marks **missed** steps (a step scheduled for an earlier day that wasn't completed) as faded/struck-through, a **14-day streak strip** shows each day filed as done / missed / today, and every assignment shows a **25/50/75/100% milestone rail** (the detail page mirrors the same milestone dots under its progress bar).
- **No dead ends.** Every state always has a forward path: an assignment with open tasks but no planned days left gets a **Re-plan daily steps** button on its card (regenerates targets from the remaining tasks via `buildDailyPlan`), the dashboard's empty state routes to **Re-plan daily steps** (or **Add an assignment** when nothing exists yet), skipping verification on the celebration screen is never permanent (a **Verify my work** button stays until claimed, then shows a **Verified ✓** pill), and rolled-over steps shown from the dashboard carry a **next · <date>** badge so they're never mistaken for today's step. Full-app audit fixes: completing the last sub-task is reversible (**Undo a step** on the celebration card), the Flow-State **"Let's ride"** button only appears when a next step actually exists, FlowCite's empty references list and the "everything redeemed" rewards state both have working CTAs, the Flow Friday modal can't open empty and disables rewards the user can't afford (guarding the reducer from negative balances), Settings renders a recovery card instead of a blank page, and the create wizard's accepted screen has a **Back to plan** exit.
- **Settings & safety.** Beyond theme/font/motion, Settings exposes a **connected document** (Google Docs — POE Draft, Microsoft Word — Assignment 3, or Pen & paper) that verification layer 1 checks without reading contents, a **study buddy** opt-in, and **gentle reminders** locked to "max 2 a day, never after 9 PM". **Export my data** downloads everything as JSON; **delete account** clears local state and returns you to sign-up. Flow Friday's rewards carry an explicit funding disclaimer (partnerships/sponsorship, never user data).

---

## Scripts

```bash
npm run dev -- --webpack -p 3210   # dev server (webpack)
npm run build -- --webpack         # production build; passthrough required: npx next build --webpack
npm run lint                       # ESLint (scripts/** ignored — plain CJS)
npm run typecheck                  # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run capture                    # node scripts/screenshots.js (needs dev server running)
```

### Screenshot capture

`scripts/screenshots.js` drives a real headless Chrome through the whole demo with a deterministic script and saves **50 PNGs** (25 mobile @ 375×812 + 25 desktop @ 1280×800) into `screenshots/mobile/` and `screenshots/desktop/`:

```bash
npm run dev -- --webpack -p 3210   # in one terminal
npm run capture                    # in another
```

Key points:

- Requires `puppeteer-core` (already installed) and Google Chrome; override the binary with `CHROME_PATH`.
- The helper `clickButton(page, text, { tabs })` deliberately **excludes `role="tab"`** matches — the FlowCite "Analyse Question" button used to be shadowed by its identically-labelled tab, which silently skipped the analysis step.
- Each viewport runs in **its own isolated browser context** so `localStorage` state doesn't leak between the mobile and desktop runs.
- Waits are generous (hydration settle, `innerText` is matched **case-insensitively** because CSS `text-transform: uppercase` changes what `innerText` reports).
- A failure dumps `screenshots/_debug_failure.png` for diagnosis.

---

## Known environment notes

- **npm can be flaky** on this machine — retry once if an install/run errors spuriously.
- SWC/Turbopack binaries are broken → webpack everywhere.
- This is a prototype: demo data only, no real backend or accounts.