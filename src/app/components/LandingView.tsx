"use client";

import { useCallback } from "react";

interface LandingViewProps {
  onFileSelected: (file: File) => void;
}

export default function LandingView({ onFileSelected }: LandingViewProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
      <div className="text-center max-w-[520px] px-10 py-15">
        <div className="flex items-center justify-center gap-2 text-[15px] font-semibold tracking-tight mb-12">
          <div className="w-2 h-2 rounded-full bg-accent" />
          Resume Builder
        </div>

        <h1 className="text-[32px] font-bold tracking-tight leading-tight mb-3">
          Your resume, refined by AI
        </h1>
        <p className="text-base text-text-secondary leading-relaxed mb-10">
          Upload your resume and edit it with natural language.
          Tailor it for any job in seconds.
        </p>

        <label
          className="block border-2 border-dashed border-border-strong rounded-[var(--radius-lg)] p-12 cursor-pointer transition-all bg-surface hover:border-accent hover:bg-accent-light group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="w-12 h-12 rounded-xl bg-accent-light mx-auto mb-4 flex items-center justify-center group-hover:bg-white/60">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold mb-1">
            Drop your PDF resume here
          </h3>
          <p className="text-[13px] text-text-tertiary">
            or click to browse · PDF only
          </p>
        </label>

        <div className="flex gap-8 mt-12 text-left">
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold mb-1">AI Editing</h4>
            <p className="text-[12px] text-text-tertiary leading-snug">
              Edit your resume with natural language — no formatting hassles
            </p>
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold mb-1">Job Tailoring</h4>
            <p className="text-[12px] text-text-tertiary leading-snug">
              Paste a job URL to create a variant optimized for that role
            </p>
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold mb-1">PDF Export</h4>
            <p className="text-[12px] text-text-tertiary leading-snug">
              Download a polished, professionally typeset PDF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
