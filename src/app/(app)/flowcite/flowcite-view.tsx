"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { FLOWCITE_SOURCES, type SuggestedSource } from "@/lib/data/mock";
import {
  CITE_KINDS,
  CITE_TYPE_SPECS,
  harvardCitation,
  type CiteFieldKey,
  type CiteKind,
  type Ref,
} from "@/lib/references";
import { uid } from "@/lib/utils";
import type { Reference, ReferenceId, AchievementId } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput, Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { CopyCitationDialog, type CitationShape } from "@/components/ui/copy-citation-dialog";
import {
  BookOpenCheck,
  Check,
  Copy,
  Library,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

interface DraftRef {
  authors: string;
  year: string;
  title: string;
  source: string;
  pages: string;
  doi: string;
  kind: string;
  url: string;
  publisher: string;
  city: string;
  edition: string;
  volume: string;
  issue: string;
  date: string;
  reportNumber: string;
  degree: string;
  university: string;
}

const DRAFT_FIELD_KEYS: Record<CiteFieldKey, keyof DraftRef> = {
  url: "url",
  volume: "volume",
  issue: "issue",
  city: "city",
  edition: "edition",
  date: "date",
  reportNumber: "reportNumber",
  degree: "degree",
  university: "university",
  publisher: "publisher",
};

const emptyDraft = (s: SuggestedSource): DraftRef => ({
  authors: s.authors,
  year: s.year,
  title: s.title,
  source: s.source,
  pages: "",
  doi: s.doi ?? "",
  kind: "Book",
  url: "",
  publisher: "",
  city: "",
  edition: "",
  volume: "",
  issue: "",
  date: "",
  reportNumber: "",
  degree: "",
  university: "",
});

function CitationBuilderCard({
  source,
  draft,
  onDraftChange,
  generated,
  copied,
  saved,
  onGenerate,
  onCopy,
  onSave,
  onClose,
}: {
  source: SuggestedSource;
  draft: DraftRef;
  onDraftChange: (d: DraftRef) => void;
  generated: string | null;
  copied: boolean;
  saved: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const spec = CITE_TYPE_SPECS[draft.kind as CiteKind] ?? CITE_TYPE_SPECS.Book;

  const missingRequired: string[] = [];
  if (!draft.source.trim()) missingRequired.push(spec.sourceLabel.toLowerCase());
  if (spec.usesPages && !draft.pages.trim()) missingRequired.push("page range");
  for (const f of spec.extra) {
    if (f.required && !draft[DRAFT_FIELD_KEYS[f.key]].trim()) {
      missingRequired.push(f.label.toLowerCase());
    }
  }
  const ready = missingRequired.length === 0;

  return (
    <Card aria-labelledby="cite-title" className="border-calm-blue/40 bg-calm-blue-light/20">
      <div className="flex items-start justify-between gap-3">
        <h2 id="cite-title" className="font-bold text-ink">Build your citation</h2>
        <button type="button" onClick={onClose} className="text-xs font-bold text-calm-blue hover:underline cursor-pointer">
          ← Back to sources
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Auto-filled from <em>{source.title}</em>. Pick the cite type — each one asks for exactly the
        details its citation needs, like a website link or a journal volume.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Authors">
          <TextInput value={draft.authors} onChange={(e) => onDraftChange({ ...draft, authors: e.target.value })} />
        </Field>
        <Field label="Year">
          <TextInput value={draft.year} onChange={(e) => onDraftChange({ ...draft, year: e.target.value })} />
        </Field>
        <Field label="Title">
          <TextInput value={draft.title} onChange={(e) => onDraftChange({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Cite type">
          <Select
            id="cite-type"
            value={draft.kind}
            onChange={(e) => onDraftChange({ ...draft, kind: e.target.value })}
          >
            {CITE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={spec.sourceLabel} required hint={spec.sourcePlaceholder}>
          <TextInput
            id="cite-source"
            value={draft.source}
            onChange={(e) => onDraftChange({ ...draft, source: e.target.value })}
            placeholder={spec.sourcePlaceholder}
          />
        </Field>
        {spec.extra.map((f) => (
          <Field key={f.key} label={f.label} required={f.required}>
            <TextInput
              value={draft[DRAFT_FIELD_KEYS[f.key]]}
              onChange={(e) => onDraftChange({ ...draft, [DRAFT_FIELD_KEYS[f.key]]: e.target.value })}
              placeholder={f.placeholder}
            />
          </Field>
        ))}
        {spec.usesPages && (
          <Field label={spec.pagesLabel ?? "Page range used"} required hint="Required — e.g. 12–18">
            <TextInput
              id="page-number"
              value={draft.pages}
              onChange={(e) => onDraftChange({ ...draft, pages: e.target.value })}
              placeholder="e.g. 12–18"
            />
          </Field>
        )}
        <Field label="DOI (optional)">
          <TextInput value={draft.doi} onChange={(e) => onDraftChange({ ...draft, doi: e.target.value })} />
        </Field>
      </div>
      <Button className="mt-4" icon={<BookOpenCheck className="size-4" aria-hidden="true" />} disabled={!ready} onClick={onGenerate}>
        Generate Reference
      </Button>
      {!ready && (
        <p className="mt-2 text-xs text-muted">
          Add the missing {missingRequired.join(" and ")} so your reference checks out.
        </p>
      )}

      {generated && (
        <div className="mt-4 rounded-xl border border-sage/40 bg-surface p-4" aria-live="polite">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-sage">Your Harvard reference</span>
            <button type="button" onClick={onCopy} className="inline-flex items-center gap-1.5 text-xs font-bold text-calm-blue cursor-pointer">
              {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-ink">{generated}</p>
          <div className="mt-3 flex gap-3">
            <Button size="sm" variant="success" icon={<Library className="size-4" aria-hidden="true" />} disabled={saved} onClick={onSave}>
              {saved ? "Saved to My References" : "Save to My References"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function FlowCiteView() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<"analyse" | "references">("analyse");
  const [question, setQuestion] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [sources, setSources] = useState<SuggestedSource[]>([]);
  const [activeSource, setActiveSource] = useState<SuggestedSource | null>(null);
  const [draft, setDraft] = useState<DraftRef | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDeleteRef, setConfirmDeleteRef] = useState<ReferenceId | null>(null);
  const [copyTarget, setCopyTarget] = useState<CitationShape | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const analyseQuestion = () => {
    if (!question.trim() || analysing) return;
    setAnalysing(true);
    const keywords = ["visibility of system status", "feedback", "interface design", "usability heuristics"];
    timer.current = window.setTimeout(() => {
      setAnalysing(false);
      setKeywords(keywords);
      setSources(FLOWCITE_SOURCES);
    }, 1500);
  };

  const openSource = (s: SuggestedSource) => {
    setActiveSource(s);
    setDraft(emptyDraft(s));
    setGenerated(null);
    setSaved(false);
    setCopied(false);
  };

  const toRef = (): Ref | null => {
    if (!draft) return null;
    return {
      authors: draft.authors || "Author, A.",
      year: draft.year || String(new Date().getFullYear()),
      title: draft.title || "Untitled",
      source: draft.source || "Publisher",
      pages: draft.pages || undefined,
      doi: draft.doi || undefined,
      kind: draft.kind,
      url: draft.url || undefined,
      publisher: draft.publisher || undefined,
      city: draft.city || undefined,
      edition: draft.edition || undefined,
      volume: draft.volume || undefined,
      issue: draft.issue || undefined,
      date: draft.date || undefined,
      reportNumber: draft.reportNumber || undefined,
      degree: draft.degree || undefined,
      university: draft.university || undefined,
    };
  };

  const generateReference = () => {
    const ref = toRef();
    if (ref) setGenerated(harvardCitation(ref));
  };

  const saveReference = () => {
    const ref = toRef();
    if (!ref || !generated) return;
    const reference: Reference = { id: uid("ref") as ReferenceId, ...ref };
    dispatch({ type: "ADD_REFERENCE", reference });
    dispatch({ type: "UNLOCK_ACHIEVEMENT", id: "flowcite-first" as AchievementId });
    setSaved(true);
  };

  const copyCitation = () => {
    const ref = toRef();
    if (ref) setCopyTarget(ref);
  };

  const onCopied = () => {
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">FlowCite</h1>
        <p className="text-sm text-muted">
          Paste a question — get academic sources and a Harvard reference you can drop into your POE.
        </p>
      </header>

      <div role="tablist" aria-label="FlowCite sections" className="flex w-fit gap-1 rounded-xl border border-line bg-surface p-1">
        <button
          role="tab"
          aria-selected={tab === "analyse"}
          aria-controls="panel-analyse"
          id="tab-analyse"
          onClick={() => setTab("analyse")}
          className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer data-[selected=true]:bg-calm-blue data-[selected=true]:text-white"
          data-selected={tab === "analyse"}
        >
          Analyse Question
        </button>
        <button
          role="tab"
          aria-selected={tab === "references"}
          aria-controls="panel-references"
          id="tab-references"
          onClick={() => setTab("references")}
          className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer data-[selected=true]:bg-calm-blue data-[selected=true]:text-white"
          data-selected={tab === "references"}
        >
          My References ({state.references.length})
        </button>
      </div>

      {tab === "analyse" ? (
        <div id="panel-analyse" role="tabpanel" aria-labelledby="tab-analyse" className="space-y-6">
          <Card>
            <label htmlFor="fc-question" className="block font-semibold text-sm text-ink">
              Paste the question you're working on
            </label>
            <textarea
              id="fc-question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Discuss the role of visibility of system status in interface design…"
              className="mt-2 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-ink placeholder:text-muted/70"
            />
            <Button
              size="full"
              className="mt-3"
              icon={analysing ? <Spinner /> : <Search className="size-4" aria-hidden="true" />}
              disabled={analysing || !question.trim()}
              loading={analysing}
              onClick={analyseQuestion}
            >
              {analysing ? "Finding sources…" : "Analyse Question"}
            </Button>
            <p className="mt-2 text-xs text-muted">
              Our AI extracts key concepts and matches academic sources from Semantic Scholar, Crossref, DOAJ and Google Books.
            </p>
          </Card>

          {analysing && (
            <Card aria-live="polite" className="text-center text-calm-blue">
              <BookOpenCheck className="mx-auto animate-pulse size-8" aria-hidden="true" />
              <p className="mt-2 font-semibold">Finding sources that fit your question…</p>
            </Card>
          )}

          {!analysing && keywords.length > 0 && (
            <section aria-label="Matched concepts">
              <h2 className="mb-2 text-sm font-bold text-ink">Matched concepts</h2>
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <Badge key={k} tone="accent" icon={<Sparkles className="size-3.5" aria-hidden="true" />}>
                    {k}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {!analysing && sources.length > 0 && (
            <section aria-label="Suggested sources">
              <h2 className="mb-3 text-sm font-bold text-ink">Suggested sources ({sources.length})</h2>
              <div className="grid gap-3">
                {sources.map((s) =>
                  activeSource?.id === s.id && draft ? (
                    <CitationBuilderCard
                      key={s.id}
                      source={s}
                      draft={draft}
                      onDraftChange={setDraft}
                      generated={generated}
                      copied={copied}
                      saved={saved}
                      onGenerate={generateReference}
                      onCopy={copyCitation}
                      onSave={saveReference}
                      onClose={() => {
                        setActiveSource(null);
                        setDraft(null);
                        setGenerated(null);
                        setSaved(false);
                        setCopied(false);
                      }}
                    />
                  ) : (
                    <Card key={s.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{s.title}</p>
                          <p className="mt-0.5 text-sm text-muted">
                            {s.authors} · {s.year}
                          </p>
                        </div>
                        <Badge tone="neutral">{s.kind}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted">{s.source}</p>
                      <Button size="sm" variant="secondary" className="mt-3" onClick={() => openSource(s)}>
                        Use this source
                      </Button>
                    </Card>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div id="panel-references" role="tabpanel" aria-labelledby="tab-references" className="space-y-4">
          {state.references.length === 0 ? (
            <Card className="text-center py-10">
              <Library className="mx-auto size-10 text-calm-blue" aria-hidden="true" />
              <p className="mt-3 font-bold text-ink">No saved references yet</p>
              <p className="mt-1 text-sm text-muted">Analyse a question and save your first reference.</p>
              <Button size="sm" className="mt-4" onClick={() => setTab("analyse")}>
                Analyse a question
              </Button>
            </Card>
          ) : (
            state.references.map((ref) => (
              <Card key={ref.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed text-ink">{harvardCitation(ref)}</p>
                  <div className="flex shrink-0 items-start gap-1">
                    <Tooltip label="Copy citation">
                    <button
                      type="button"
                      onClick={() => setCopyTarget(ref)}
                      aria-label="Copy citation"
                      className="inline-flex items-center rounded-full p-1.5 text-muted transition-colors hover:bg-calm-blue-light hover:text-calm-blue cursor-pointer"
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </button>
                  </Tooltip>
                    {confirmDeleteRef === ref.id ? (
                      <DeleteConfirm
                        title="this reference"
                        onConfirm={() => dispatch({ type: "DELETE_REFERENCE", id: ref.id })}
                        onCancel={() => setConfirmDeleteRef(null)}
                      />
                    ) : (
                      <Tooltip label="Delete">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRef(ref.id)}
                          aria-label="Delete this reference"
                          className="inline-flex items-center rounded-full p-1.5 text-muted transition-colors hover:bg-peach-light hover:text-peach cursor-pointer"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <CopyCitationDialog
        open={copyTarget !== null}
        reference={copyTarget}
        onClose={() => setCopyTarget(null)}
        onCopied={onCopied}
      />
    </div>
  );
}