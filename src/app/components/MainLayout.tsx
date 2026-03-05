"use client";

import { ResumeVariant } from "@/lib/types";
import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";

interface MainLayoutProps {
  variants: ResumeVariant[];
  activeVariant: ResumeVariant;
  onSelectVariant: (id: string) => void;
  onDeleteVariant: (id: string) => void;
  onTailor: (jdUrl: string) => void;
  onSendMessage: (message: string) => void;
  onUploadNew: () => void;
  onDownload: () => void;
  isProcessing: boolean;
  isTailoring: boolean;
  isCompiling: boolean;
}

export default function MainLayout({
  variants,
  activeVariant,
  onSelectVariant,
  onDeleteVariant,
  onTailor,
  onSendMessage,
  onUploadNew,
  onDownload,
  isProcessing,
  isTailoring,
  isCompiling,
}: MainLayoutProps) {
  return (
    <div className="grid grid-cols-[220px_1fr_360px] grid-rows-[52px_1fr] h-screen overflow-hidden">
      {/* Header */}
      <header className="col-span-3 flex items-center justify-between px-5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          Resume Builder
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUploadNew}
            className="px-3.5 py-1.5 rounded-md text-[13px] font-medium border border-border bg-surface hover:bg-surface-alt transition-colors cursor-pointer"
          >
            Upload New
          </button>
          <button
            onClick={onDownload}
            disabled={!activeVariant.compiledPdf}
            className="px-3.5 py-1.5 rounded-md text-[13px] font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Download PDF
          </button>
        </div>
      </header>

      {/* Left Panel */}
      <LeftPanel
        variants={variants}
        activeVariantId={activeVariant.id}
        onSelectVariant={onSelectVariant}
        onDeleteVariant={onDeleteVariant}
        onTailor={onTailor}
        isTailoring={isTailoring}
      />

      {/* Center Panel */}
      <CenterPanel
        previewImages={activeVariant.previewImages}
        isLoading={isCompiling || isTailoring}
        variantType={activeVariant.metadata.type}
      />

      {/* Right Panel */}
      <RightPanel
        variant={activeVariant}
        onSendMessage={onSendMessage}
        isProcessing={isProcessing || isTailoring}
        showWelcome={true}
      />
    </div>
  );
}
