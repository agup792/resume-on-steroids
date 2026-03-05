"use client";

import { ResumeVariant } from "@/lib/types";
import { useState } from "react";

interface LeftPanelProps {
  variants: ResumeVariant[];
  activeVariantId: string;
  onSelectVariant: (id: string) => void;
  onDeleteVariant: (id: string) => void;
  onTailor: (jdUrl: string) => void;
  isTailoring: boolean;
}

export default function LeftPanel({
  variants,
  activeVariantId,
  onSelectVariant,
  onDeleteVariant,
  onTailor,
  isTailoring,
}: LeftPanelProps) {
  const [jdUrl, setJdUrl] = useState("");

  const handleTailor = () => {
    if (jdUrl.trim()) {
      onTailor(jdUrl.trim());
      setJdUrl("");
    }
  };

  return (
    <div className="bg-surface border-r border-border flex flex-col overflow-y-auto">
      <div className="px-4 pt-4 pb-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Versions
      </div>

      <div className="flex-1 px-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelectVariant(v.id)}
            aria-current={v.id === activeVariantId ? "true" : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors group text-left ${
              v.id === activeVariantId ? "bg-accent-light" : "hover:bg-surface-alt"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                v.metadata.type === "original" ? "bg-accent" : "bg-success"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{v.name}</div>
              <div className="text-[11px] text-text-tertiary">
                {v.metadata.type === "original" ? "Original" : "Tailored"}
              </div>
            </div>
            {v.metadata.type === "tailored" && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVariant(v.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onDeleteVariant(v.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-500 transition-all text-xs cursor-pointer"
                title="Delete variant"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-2">
          Tailor for a job
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="Paste job URL or description..."
            className="flex-1 px-2.5 py-1.5 rounded-md border border-border text-[12px] bg-surface outline-none focus:border-accent placeholder:text-text-tertiary"
            disabled={isTailoring}
            onKeyDown={(e) => e.key === "Enter" && handleTailor()}
          />
          <button
            onClick={handleTailor}
            disabled={!jdUrl.trim() || isTailoring}
            className="px-2.5 py-1.5 rounded-md text-[12px] font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isTailoring ? "..." : "Go"}
          </button>
        </div>
      </div>
    </div>
  );
}
