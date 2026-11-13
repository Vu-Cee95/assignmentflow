"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Database,
  Download,
  FileText,
  Handshake,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { FontSize, Theme } from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { useState } from "react";

const SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 100, label: "Default (100%)" },
  { value: 125, label: "Large (125%)" },
  { value: 150, label: "Extra large (150%)" },
];

const THEME_OPTIONS: { value: Theme; label: string; hint: string }[] = [
  { value: "default", label: "Calm", hint: "The signature soft palette" },
  { value: "dark", label: "Dark", hint: "Easy on the eyes at night" },
  { value: "high-contrast", label: "High contrast", hint: "Maximum clarity" },
];

const DOC_OPTIONS = [
  { value: "Google Docs — POE Draft", label: "Google Docs", hint: "POE Draft" },
  { value: "Microsoft Word — Assignment 3", label: "Microsoft Word", hint: "Assignment 3" },
  { value: "pen-paper", label: "Pen & paper", hint: "Offline — verify with a photo instead" },
];

export function SettingsView() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const user = state.user;
  const prefs = user?.preferences;

  if (!user || !prefs) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center py-10">
          <RotateCcw className="mx-auto size-10 text-calm-blue" aria-hidden="true" />
          <p className="mt-3 font-bold text-ink">We couldn't read your preferences.</p>
          <p className="mt-1 text-sm text-muted">
            Your saved settings look out of date. Sign in again to reset them cleanly.
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button variant="outline">Go to sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const setTheme = (t: Theme) => dispatch({ type: "UPDATE_PREFERENCES", prefs: { theme: t } });
  const setConnectedDocument = (v: string) =>
    dispatch({
      type: "UPDATE_PREFERENCES",
      prefs: { connectedDocument: v === "pen-paper" ? "None (pen & paper)" : v },
    });

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { name: user.name, email: user.email, xp: user.xp, streak: user.streak },
      assignments: state.assignments,
      dailyTargets: state.dailyTargets,
      references: state.references,
      supportMessages: state.supportMessages,
      comments: state.comments,
      achievements: user.achievements,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignmentflow-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = () => {
    try {
      window.localStorage.removeItem("assignmentflow.state.v2");
    } catch {
      // storage unavailable — in-memory reset still works
    }
    dispatch({ type: "LOGOUT" });
    router.replace("/signup");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="text-sm text-muted">Make the app fit how your eyes and brain work.</p>
      </header>

      <Card>
        <p className="text-sm font-bold uppercase tracking-wide text-muted">Account</p>
        <p className="mt-3 font-bold text-ink">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
      </Card>

      <Card>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Palette className="size-4" aria-hidden="true" /> Theme
        </p>
        <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={prefs.theme === t.value}
              onClick={() => setTheme(t.value)}
              className="rounded-xl border border-line bg-canvas p-3 text-left cursor-pointer data-[checked=true]:border-calm-blue data-[checked=true]:bg-calm-blue-light"
              data-checked={prefs.theme === t.value}
            >
              <span className="block font-semibold text-ink">{t.label}</span>
              <span className="block text-xs text-muted">{t.hint}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Type className="size-4" aria-hidden="true" /> Text size
        </p>
        <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Text size">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={prefs.fontSize === s.value}
              onClick={() => dispatch({ type: "UPDATE_PREFERENCES", prefs: { fontSize: s.value } })}
              className="rounded-xl border border-line bg-canvas p-3 text-left font-semibold text-ink cursor-pointer data-[checked=true]:border-calm-blue data-[checked=true]:bg-calm-blue-light"
              data-checked={prefs.fontSize === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-ink">
              <Moon className="size-4" aria-hidden="true" /> Reduce motion
            </p>
            <p className="mt-0.5 text-sm text-muted">Dial animations right down if they bother you.</p>
          </div>
          <Toggle
            checked={prefs.reducedMotion}
            onChange={(reducedMotion) => dispatch({ type: "UPDATE_PREFERENCES", prefs: { reducedMotion } })}
            label="Reduce motion"
          />
        </div>
      </Card>

      <Card>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <FileText className="size-4" aria-hidden="true" /> Connected document
        </p>
        <p className="mt-2 text-sm text-muted">
          Verification layer 1 checks this document to confirm your session happened — we never read
          its contents.
        </p>
        <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Connected document">
          {DOC_OPTIONS.map((d) => {
            const active = prefs.connectedDocument === (d.value === "pen-paper" ? "None (pen & paper)" : d.value);
            return (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setConnectedDocument(d.value)}
                className="rounded-xl border border-line bg-canvas p-3 text-left cursor-pointer data-[checked=true]:border-calm-blue data-[checked=true]:bg-calm-blue-light"
                data-checked={active}
              >
                <span className="block font-semibold text-ink">{d.label}</span>
                <span className="block text-xs text-muted">{d.hint}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-ink">
              <Handshake className="size-4" aria-hidden="true" /> Study buddy
            </p>
            <p className="mt-0.5 text-sm text-muted">
              A trusted friend can confirm a session for you — one more verification layer, one less to do alone.
            </p>
          </div>
          <Toggle
            checked={prefs.studyBuddy ?? false}
            onChange={(studyBuddy) => dispatch({ type: "UPDATE_PREFERENCES", prefs: { studyBuddy } })}
            label="Study buddy"
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-ink">
              <Bell className="size-4" aria-hidden="true" /> Gentle reminders
            </p>
            <p className="mt-0.5 text-sm text-muted">
              At most 2 notifications a day, and never after 9 PM. Quiet, on your terms.
            </p>
          </div>
          <Toggle
            checked={prefs.notificationsEnabled ?? false}
            onChange={(notificationsEnabled) => dispatch({ type: "UPDATE_PREFERENCES", prefs: { notificationsEnabled } })}
            label="Notifications"
          />
        </div>
      </Card>

      <Card>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Database className="size-4" aria-hidden="true" /> Data & privacy
        </p>
        <div className="mt-3 space-y-3">
          <Button variant="outline" size="full" icon={<Download className="size-4" aria-hidden="true" />} onClick={exportData}>
            Export my data (JSON)
          </Button>
          {confirmDelete ? (
            <DeleteConfirm title="your account and data" onConfirm={deleteAccount} onCancel={() => setConfirmDelete(false)} />
          ) : (
            <Button variant="danger" size="full" icon={<Trash2 className="size-4" aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>
              Delete my account and data
            </Button>
          )}
          <p className="text-xs text-muted">
            All progress lives on this device only. Export a backup before deleting.
          </p>
        </div>
      </Card>

      <div>
        <Button
          variant="danger"
          size="full"
          icon={<LogOut className="size-4" aria-hidden="true" />}
          onClick={() => {
            dispatch({ type: "LOGOUT" });
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
        <p className="mt-2 text-center text-xs text-muted">
          Signing out keeps this device's progress. It clears it only on this browser.
        </p>
      </div>
    </div>
  );
}