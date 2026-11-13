"use client";

import type { CSSProperties } from "react";
import { Tooltip } from "@/components/ui/tooltip";

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FUN_FONT: CSSProperties = {
  fontFamily: "'Comic Sans MS', 'Segoe Print', 'Chalkboard SE', cursive",
};

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Tooltip label="Yes, delete">
        <button
          type="button"
          onClick={onConfirm}
          aria-label={`Yes, delete ${title}`}
          className="grid size-7 place-items-center rounded-full bg-sage text-white shadow-sm transition-transform hover:scale-110 hover:-rotate-6 cursor-pointer"
          style={FUN_FONT}
        >
          <span className="text-lg font-bold leading-none">✓</span>
        </button>
      </Tooltip>
      <Tooltip label="No, keep it">
        <button
          type="button"
          onClick={onCancel}
          aria-label={`No, keep ${title}`}
          className="grid size-7 place-items-center rounded-full bg-peach-light text-peach shadow-sm transition-transform hover:scale-110 hover:rotate-6 cursor-pointer"
          style={FUN_FONT}
        >
          <span className="text-lg font-bold leading-none">✗</span>
        </button>
      </Tooltip>
    </span>
  );
}