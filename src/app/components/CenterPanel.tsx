"use client";

import { useEffect, useState } from "react";

interface CenterPanelProps {
  pdfData: Uint8Array | null;
  isLoading: boolean;
  variantType: "original" | "tailored";
}

export default function CenterPanel({ pdfData, isLoading, variantType }: CenterPanelProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfData) {
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdfData]);

  return (
    <div className={`bg-bg flex flex-col items-center justify-center p-6 overflow-auto relative ${
      variantType === "tailored" ? "ring-2 ring-inset ring-success/20" : ""
    }`}>
      {isLoading && (
        <div className="absolute inset-0 bg-bg/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-3 border-border border-t-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Compiling preview...</p>
          </div>
        </div>
      )}

      {pdfUrl ? (
        <div className="w-full max-w-[595px] h-full">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 rounded shadow-lg bg-white"
            title="Resume Preview"
          />
        </div>
      ) : (
        <div className="text-center text-text-tertiary">
          <div className="w-16 h-16 rounded-2xl bg-surface mx-auto mb-4 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-sm">Resume preview will appear here</p>
        </div>
      )}
    </div>
  );
}
