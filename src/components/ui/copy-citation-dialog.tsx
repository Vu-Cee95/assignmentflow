"use client";

import { useState } from "react";
import { BookOpenCheck, Quote } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  CITATION_STYLES,
  formatCitation,
  formatInText,
  type CitationStyle,
} from "@/lib/references";
import type { Reference } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type CitationShape = Pick<
  Reference,
  | "authors"
  | "year"
  | "title"
  | "source"
  | "pages"
  | "doi"
  | "kind"
  | "url"
  | "publisher"
  | "city"
  | "edition"
  | "volume"
  | "issue"
  | "date"
  | "reportNumber"
  | "degree"
  | "university"
>;

interface CopyCitationDialogProps {
  open: boolean;
  reference: CitationShape | null;
  onClose: () => void;
  onCopied?: () => void;
}

export function CopyCitationDialog({ open, reference, onClose, onCopied }: CopyCitationDialogProps) {
  const [style, setStyle] = useState<CitationStyle>("harvard");

  const copy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      onCopied?.();
    } catch {
      // clipboard unavailable
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Copy citation" size="sm">
      {reference && (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Citation style">
            {CITATION_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style === s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors",
                  style === s.id
                    ? "border-calm-blue bg-calm-blue-light text-calm-blue"
                    : "border-line bg-surface text-muted hover:border-calm-blue/40"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-canvas p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Bibliography</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{formatCitation(style, reference)}</p>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">In-text citation</p>
            <p className="mt-1 text-sm text-ink">{formatInText(style, reference)}</p>
          </div>

          <div className="grid gap-2">
            <Button icon={<BookOpenCheck className="size-4" aria-hidden="true" />} onClick={() => copy(formatCitation(style, reference))}>
              Copy bibliography
            </Button>
            <Button variant="outline" icon={<Quote className="size-4" aria-hidden="true" />} onClick={() => copy(formatInText(style, reference))}>
              Copy in-text citation
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}