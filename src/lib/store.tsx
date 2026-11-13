"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { appReducer, createInitialState } from "@/lib/domain/state";
import type { AppAction, AppState } from "@/lib/domain/types";

const STORAGE_KEY = "assignmentflow.state.v2";

const PERSIST_KEYS: (keyof AppState)[] = [
  "user",
  "isAuthenticated",
  "onboardingComplete",
  "assignments",
  "activeAssignmentId",
  "activeTargetId",
  "dailyTargets",
  "rewards",
  "redeemedRewardIds",
  "supportMessages",
  "heartedMessageIds",
  "references",
  "rememberedAssignments",
  "comments",
  "commentSavedIds",
  "bookmarkedMessageIds",
];

function loadInitialState(): AppState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw) as Partial<AppState>;
    return { ...createInitialState(), ...saved };
  } catch {
    return createInitialState();
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  // Persist the slice that matters for the demo experience.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const toStore: Record<string, unknown> = {};
      for (const key of PERSIST_KEYS) {
        toStore[key] = state[key];
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Storage unavailable (private browsing / quota) — app keeps working in-memory.
    }
  }, [state]);

  // Mirror accessibility preferences onto <html> so global CSS can react.
  useEffect(() => {
    const prefs = state.user?.preferences;
    if (!prefs) return;
    const el = document.documentElement;
    el.dataset.fontSize = String(prefs.fontSize);
    el.dataset.reducedMotion = String(prefs.reducedMotion);
    if (prefs.theme === "high-contrast") el.dataset.theme = "high-contrast";
    else if (prefs.theme === "dark") el.dataset.theme = "dark";
    else delete el.dataset.theme;
  }, [state.user?.preferences]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
  );
}

export function useApp(): { state: AppState; dispatch: React.Dispatch<AppAction> } {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}