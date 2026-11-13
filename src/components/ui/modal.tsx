"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  hideClose?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, size = "md", hideClose = false }: ModalProps) {
  const titleId = useId();
  const removeRingRef = useRef<HTMLElement | null>(null);

  // Focus trap + Escape + restore focus (WCAG 2.1.2, 2.4.3, 3.2.1).
  useEffect(() => {
    if (!open) return;
    const dialog = document.getElementById(titleId)?.closest('[role="dialog"]') as HTMLElement | null;
    if (!dialog) return;
    removeRingRef.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
    const first = () => focusables()[0];
    const last = () => focusables().at(-1);

    (first() ?? dialog).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const idx = list.indexOf(current!);
      if (e.shiftKey && idx <= 0) {
        e.preventDefault();
        last()?.focus();
      } else if (!e.shiftKey && idx === list.length - 1) {
        e.preventDefault();
        first()?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      removeRingRef.current?.focus();
    };
  }, [open, onClose, titleId]);

  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-ink/50 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-label`}
            id={titleId}
            className={cn(
              "relative w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface shadow-2xl p-6",
              size === "sm" && "sm:max-w-sm",
              size === "md" && "sm:max-w-md",
              size === "lg" && "sm:max-w-2xl"
            )}
            initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 id={`${titleId}-label`} className="text-lg font-bold text-ink">
                {title}
              </h2>
              {!hideClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={`Close ${title}`}
                  className="rounded-lg p-1.5 text-muted hover:bg-line/60 hover:text-ink cursor-pointer"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}