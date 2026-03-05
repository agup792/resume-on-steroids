"use client";

interface CenterPanelProps {
  previewImages: string[];
  isLoading: boolean;
  variantType: "original" | "tailored";
}

export default function CenterPanel({ previewImages = [], isLoading, variantType }: CenterPanelProps) {
  return (
    <div
      className={`bg-bg relative overflow-auto min-h-0 ${
        variantType === "tailored" ? "ring-2 ring-inset ring-success/20" : ""
      }`}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-bg/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-3 border-border border-t-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Compiling preview...</p>
          </div>
        </div>
      )}

      {previewImages.length > 0 ? (
        <div className="flex flex-col items-center gap-4 w-full">
          {previewImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Page ${i + 1}`}
              className="rounded shadow-lg bg-white"
              style={{ width: "100%", maxWidth: "595px", height: "auto" }}
            />
          ))}
          {previewImages.length > 0 && (
            <p className="text-xs text-text-tertiary mt-2">
              {previewImages.length} page{previewImages.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
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
        </div>
      )}
    </div>
  );
}
