"use client";

import { ParsingStep } from "@/lib/types";

interface ParsingViewProps {
  steps: ParsingStep[];
  fileName: string;
}

export default function ParsingView({ steps, fileName }: ParsingViewProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
      <div className="text-center max-w-[420px] px-10 py-15">
        <div className="w-12 h-12 rounded-full border-3 border-border border-t-accent animate-spin mx-auto mb-6" />
        <h2 className="text-lg font-semibold mb-1">Processing your resume</h2>
        <p className="text-sm text-text-secondary mb-1">{fileName}</p>

        <div className="text-left mt-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0 text-sm"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  step.status === "done"
                    ? "bg-success-light text-success"
                    : step.status === "active"
                    ? "bg-accent-light text-accent"
                    : "bg-surface-alt text-text-tertiary"
                }`}
              >
                {step.status === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : step.status === "active" ? (
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-accent-light border-t-accent animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
                )}
              </div>
              <span className={step.status === "pending" ? "text-text-tertiary" : ""}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
