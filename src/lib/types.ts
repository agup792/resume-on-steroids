export interface AppState {
  status: "landing" | "parsing" | "ready";
  variants: ResumeVariant[];
  activeVariantId: string;
}

export interface ResumeVariant {
  id: string;
  name: string;
  typstSource: string;
  typstHistory: string[];
  compiledPdf: Uint8Array | null;
  chatHistory: ChatMessage[];
  metadata: {
    type: "original" | "tailored";
    sourceJdUrl?: string;
    rubric?: string;
    createdAt: Date;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  editSummary?: string;
  clarification?: string;
  timestamp: Date;
}

export type ParsingStep = {
  label: string;
  status: "done" | "active" | "pending";
};
