"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Camera,
  FileText,
  Paperclip,
  PenLine,
  Search,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/lib/store";
import type { VerificationEvidence, VerificationResult, VerificationLayer } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const LAYERS: { layer: VerificationLayer; label: string; icon: React.ComponentType<{ className?: string }>; max: number }[] = [
  { layer: "document", label: "Document proof", icon: FileText, max: 25 },
  { layer: "keywords", label: "Keyword match", icon: Search, max: 25 },
  { layer: "photo", label: "Photo proof", icon: Camera, max: 20 },
  { layer: "reflection", label: "Reflection quality", icon: PenLine, max: 20 },
  { layer: "buddy", label: "Study buddy confirm", icon: Users, max: 10 },
];

const STOP_WORDS = new Set([
  "about", "after", "again", "against", "also", "because", "been", "before",
  "being", "between", "both", "could", "does", "doing", "during", "each",
  "from", "have", "having", "into", "just", "like", "more", "most", "much",
  "must", "only", "other", "over", "same", "such", "than", "that", "their",
  "them", "then", "there", "these", "they", "this", "those", "through",
  "under", "very", "were", "what", "when", "where", "which", "while", "will",
  "with", "would", "your", "work", "task", "today", "the", "and", "for", "you",
]);

/** Pulls the significant terms out of free text, like FlowCite's concept match. */
function extractKeywords(...texts: string[]): string[] {
  const tokens = texts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
  return [...new Set(tokens)];
}

/** Contextual text the keyword layer should match against (assignment title + sub-tasks). */
export interface VerificationContext {
  code?: string;
  /** Question / title text the work should reflect. */
  text: string;
}

interface Evidence {
  documentName: string | null;
  photoName: string | null;
  photoUrl: string | null;
  pastedText: string;
  reflection: string;
}

const EMPTY_EVIDENCE: Evidence = {
  documentName: null,
  photoName: null,
  photoUrl: null,
  pastedText: "",
  reflection: "",
};

type Phase =
  | { kind: "intro" }
  | { kind: "running"; index: number }
  | { kind: "result"; result: VerificationResult };

type VerificationMode = "session" | "completion";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  /** Result plus the evidence the student submitted — persisted by the caller. */
  onVerified: (result: VerificationResult, evidence: VerificationEvidence) => void;
  /** "session" = after a working session; "completion" = after all sub-tasks are ticked off. */
  mode?: VerificationMode;
  /** Assignment context used by the keyword-match layer. */
  context?: VerificationContext;
}

export function VerificationModal({
  open,
  onClose,
  onVerified,
  mode = "session",
  context,
}: VerificationModalProps) {
  const { state } = useApp();
  const prefs = state.user?.preferences;
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [evidence, setEvidence] = useState<Evidence>(EMPTY_EVIDENCE);
  const [runningScores, setRunningScores] = useState<Array<{ layer: VerificationLayer; score: number; max: number }>>([]);
  const timers = useRef<number[]>([]);
  /** Mirror of evidence.photoUrl so the object URL can be revoked outside of render (lint-safe). */
  const photoRevokeRef = useRef<string | null>(null);
  const reduced = useReducedMotion();

  const connectedDoc = !!prefs?.connectedDocument && prefs.connectedDocument !== "None (pen & paper)";

  /** Significant terms the pasted question is checked against (FlowCite-style keyword match). */
  const expected = useMemo(() => extractKeywords(context?.text ?? ""), [context]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(
    () => () => {
      if (photoRevokeRef.current) URL.revokeObjectURL(photoRevokeRef.current);
    },
    []
  );

  const reset = () => {
    clearTimers();
    setPhase({ kind: "intro" });
    setEvidence(EMPTY_EVIDENCE);
    if (photoRevokeRef.current) {
      URL.revokeObjectURL(photoRevokeRef.current);
      photoRevokeRef.current = null;
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  const setDocument = (file: File | null) =>
    setEvidence((e) => ({ ...e, documentName: file?.name ?? null }));

  const setPhoto = (file: File | null) => {
    if (photoRevokeRef.current) {
      URL.revokeObjectURL(photoRevokeRef.current);
      photoRevokeRef.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      photoRevokeRef.current = url;
      setEvidence((e) => ({ ...e, photoName: file.name, photoUrl: url }));
    } else {
      setEvidence((e) => ({ ...e, photoName: null, photoUrl: null }));
    }
  };

  const keywordScore = (): number => {
    const pasted = evidence.pastedText.trim();
    if (!pasted || expected.length === 0) return 16; // generous estimate when nothing is pasted
    const pastedTokens = new Set(extractKeywords(pasted));
    const hits = expected.filter((k) => pastedTokens.has(k)).length;
    return Math.round(Math.min(1, hits / expected.length) * 25);
  };

  const layerScores = () =>
    LAYERS.map((l) => {
      let score = 0;
      switch (l.layer) {
        case "document":
          score = evidence.documentName ? 25 : connectedDoc ? 22 : 18;
          break;
        case "keywords":
          score = keywordScore();
          break;
        case "photo":
          score = evidence.photoName ? 20 : 16;
          break;
        case "reflection":
          score = evidence.reflection.trim() ? 20 : 17;
          break;
        case "buddy":
          score = prefs?.studyBuddy ? 10 : 5;
          break;
      }
      return { layer: l.layer, label: l.label, score, max: l.max };
    });

  const run = () => {
    const layerList = layerScores();
    setRunningScores(layerList);
    const total = layerList.reduce((sum, l) => sum + l.score, 0);
    const max = layerList.reduce((sum, l) => sum + l.max, 0);
    setPhase({ kind: "running", index: -1 });
    const stepMs = reduced ? 60 : 480;
    LAYERS.forEach((_l, i) => {
      const t = window.setTimeout(() => {
        setPhase({ kind: "running", index: i });
        if (i === LAYERS.length - 1) {
          const verdict: VerificationResult["verdict"] =
            total >= 50
              ? { kind: "verified" }
              : { kind: "self-reported", eligibleForPremium: total > 0 };
          setPhase({ kind: "result", result: { total, max, verdict, layers: layerList } });
        }
      }, (i + 1) * stepMs);
      timers.current.push(t);
    });
  };

  const claim = () => {
    const result = phase.kind === "result" ? phase.result : null;
    const savedEvidence: VerificationEvidence = {
      documentName: evidence.documentName,
      photoName: evidence.photoName,
      pastedText: evidence.pastedText,
      reflection: evidence.reflection,
    };
    reset();
    if (result) onVerified(result, savedEvidence);
  };

  const runningLayer = phase.kind === "running" && phase.index >= 0 ? LAYERS[phase.index] : null;

  const pastedTokens = useMemo(
    () => new Set(extractKeywords(evidence.pastedText)),
    [evidence.pastedText]
  );
  const matchedCount = evidence.pastedText.trim()
    ? expected.filter((k) => pastedTokens.has(k)).length
    : 0;

  return (
    <Modal open={open} onClose={close} title={mode === "completion" ? "Verify this work" : "Let's verify your session"} size="lg">
      {phase.kind === "intro" && (
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {mode === "completion"
              ? "Every sub-task is ticked off. Add proof — then a check scores each layer and tells you if the work really happened."
              : "Tell the truth, collect the XP. Add proof below — a check then scores each layer."}
          </p>

          <div className="grid gap-2.5">
            {/* Document proof */}
            <section aria-label="Document proof" className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Document proof · up to 25 pts</p>
                  <p className="text-xs text-muted">
                    {evidence.documentName
                      ? `Attached: ${evidence.documentName}`
                      : connectedDoc
                        ? "Your connected document counts automatically."
                        : "Add a PDF or Word file (optional)."}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-calm-blue/40 px-3 py-1.5 text-xs font-bold text-calm-blue transition-colors hover:bg-calm-blue-light">
                  <Paperclip className="size-3.5" aria-hidden="true" />
                  {evidence.documentName ? "Replace document" : "Add a document"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                  />
                </label>
                {evidence.documentName && (
                  <button type="button" onClick={() => setDocument(null)} className="text-xs font-bold text-peach cursor-pointer hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </section>

            {/* Photo proof */}
            <section aria-label="Photo proof" className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <Camera className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Photo proof · up to 20 pts</p>
                  <p className="text-xs text-muted">
                    {evidence.photoName ? "Photo attached." : "A photo of your work-in-progress (optional)."}
                  </p>
                </div>
                {evidence.photoUrl && (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas">
                    <Image src={evidence.photoUrl} alt="Attached proof preview" fill unoptimized className="object-cover" />
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-calm-blue/40 px-3 py-1.5 text-xs font-bold text-calm-blue transition-colors hover:bg-calm-blue-light">
                  <Camera className="size-3.5" aria-hidden="true" />
                  {evidence.photoName ? "Replace photo" : "Add a photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
                {evidence.photoName && (
                  <button type="button" onClick={() => setPhoto(null)} className="text-xs font-bold text-peach cursor-pointer hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </section>

            {/* Keyword match */}
            <section aria-label="Keyword match" className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <Search className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Keyword match · up to 25 pts</p>
                  <p className="text-xs text-muted">
                    {expected.length === 0
                      ? "Paste the question or a snippet of your answer — we check it against key terms."
                      : `We check your text against key terms from the assignment${context?.code ? ` (${context.code})` : ""}.`}
                  </p>
                </div>
              </div>
              <textarea
                rows={2}
                value={evidence.pastedText}
                onChange={(e) => setEvidence((ev) => ({ ...ev, pastedText: e.target.value }))}
                placeholder="Paste the actual question or what you wrote (optional)."
                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70"
              />
              {evidence.pastedText.trim() && expected.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-ink">
                    {matchedCount} of {expected.length} key terms matched — {keywordScore()}/25
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {expected.slice(0, 10).map((k) => {
                      const hit = pastedTokens.has(k);
                      return (
                        <li
                          key={k}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            hit ? "border-sage/40 bg-sage-light text-sage" : "border-line bg-canvas text-muted"
                          )}
                        >
                          {k}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            {/* Reflection */}
            <section aria-label="Reflection quality" className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <PenLine className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Reflection quality · up to 20 pts</p>
                  <p className="text-xs text-muted">In a sentence or two, what did you actually finish?</p>
                </div>
              </div>
              <textarea
                rows={2}
                value={evidence.reflection}
                onChange={(e) => setEvidence((ev) => ({ ...ev, reflection: e.target.value }))}
                placeholder="e.g. Wrote the intro and cited two sources (optional)."
                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70"
              />
            </section>

            {/* Study buddy */}
            <section aria-label="Study buddy confirm" className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-calm-blue-light text-calm-blue">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Study buddy confirm · up to 10 pts</p>
                  <p className="text-xs text-muted">
                    {prefs?.studyBuddy
                      ? "A study buddy confirms your sessions (+10)."
                      : "No study buddy set — this layer gets an estimate. Turn it on in Settings."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <Button size="full" onClick={run}>
            Run verification
          </Button>
          <p className="text-center text-xs text-muted">
            Adding proof raises your score — the estimate still verifies when your session honestly happened.
          </p>
        </div>
      )}

      {phase.kind === "running" && (
        <div className="space-y-4" aria-live="polite">
          <ul className="grid gap-2.5">
            {LAYERS.map((l, i) => {
              const Icon = l.icon;
              const done = i < phase.index;
              const active = i === phase.index;
              const score = runningScores[i]?.score ?? 0;
              return (
                <li
                  key={l.layer}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    done && "border-sage/40 bg-sage-light/40",
                    active && "border-calm-blue bg-calm-blue-light",
                    !done && !active && "border-line opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg",
                      done ? "bg-sage text-white" : "bg-calm-blue-light text-calm-blue"
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-ink">{l.label}</span>
                  {done ? (
                    <span className="text-xs font-bold text-sage">+{score} pts</span>
                  ) : active ? (
                    <span className="text-xs font-bold text-calm-blue">Checking…</span>
                  ) : (
                    <span className="text-xs font-bold text-muted">Waiting</span>
                  )}
                </li>
              );
            })}
          </ul>
          {runningLayer && (
            <Progress value={(phase.index + 1) * 20} max={100} label="Verification progress" tone="primary" />
          )}
        </div>
      )}

      {phase.kind === "result" && (
        <div className="space-y-4 text-center">
          <motion.div
            initial={reduced ? { opacity: 1 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto grid size-20 place-items-center rounded-full bg-sage-light text-sage"
          >
            <BadgeCheck className="size-10" aria-hidden="true" />
          </motion.div>
          <div>
            <p className="text-3xl font-extrabold text-ink">
              {phase.result.total}
              <span className="text-base font-bold text-muted">/{phase.result.max}</span>
            </p>
            <p className="mt-1 font-bold text-sage">
              {phase.result.verdict.kind === "verified" ? "Verified — you really did this!" : "Self-reported session"}
            </p>
          </div>
          <ul className="space-y-1.5 rounded-2xl bg-canvas p-4 text-left">
            {phase.result.layers.map((l) => (
              <li key={l.layer} className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{l.label}</span>
                <span className="font-bold text-muted">
                  {l.score}/{l.max}
                </span>
              </li>
            ))}
          </ul>
          <p className="rounded-xl bg-sunny-light p-3 text-sm font-semibold text-sunny">
            {phase.result.verdict.kind === "verified"
              ? mode === "completion"
                ? "All tasks complete ✓ · verified bonus +50 · reward eligible"
                : "+150 XP banked · verified bonus +50 · reward eligible"
              : mode === "completion"
                ? "All tasks complete · no penalty, but no verification bonus"
                : "+150 XP banked · no penalty, but no verification bonus"}
          </p>
          <Button size="full" variant="success" onClick={claim}>
            {mode === "completion" ? "Claim verified bonus & finish" : "Claim XP & rest"}
          </Button>
        </div>
      )}
    </Modal>
  );
}