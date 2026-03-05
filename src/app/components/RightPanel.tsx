"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage as ChatMessageType, ResumeVariant } from "@/lib/types";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import SuggestionChips from "./SuggestionChips";

interface RightPanelProps {
  variant: ResumeVariant;
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  showWelcome: boolean;
}

const INITIAL_SUGGESTIONS = [
  "Make my summary more concise",
  "Improve my bullet points",
  "Add a skills section",
  "Reorder sections by relevance",
];

export default function RightPanel({
  variant,
  onSendMessage,
  isProcessing,
  showWelcome,
}: RightPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [variant.chatHistory, isProcessing]);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="bg-surface border-l border-border flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[13px] font-semibold">{variant.name}</div>
        <div className="text-[11px] text-text-tertiary">
          {variant.metadata.type === "tailored" ? "Tailored variant" : "Original resume"}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-3 min-h-0">
        {variant.chatHistory.length === 0 && showWelcome && (
          <div className="px-4 py-2">
            <div className="bg-surface-alt rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] leading-relaxed text-text">
              <p className="font-medium mb-2">Welcome! Your resume has been processed.</p>
              <p className="text-text-secondary">
                I can help you edit any part of your resume using natural language.
                Try one of the suggestions below, or ask me anything.
              </p>
            </div>
          </div>
        )}

        {variant.chatHistory.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isProcessing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions — show when no user messages yet */}
      {variant.chatHistory.filter((m) => m.role === "user").length === 0 && (
        <SuggestionChips
          suggestions={INITIAL_SUGGESTIONS}
          onSelect={(s) => onSendMessage(s)}
        />
      )}

      {/* Variant context hint */}
      {variant.metadata.type === "tailored" && (
        <div className="px-4 py-1.5 text-[11px] text-text-tertiary border-t border-border bg-success-light/30">
          Editing: {variant.name} · Changes won&apos;t affect your original
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? "Processing..." : "Ask me to edit your resume... or /tailor <url>"}
            disabled={isProcessing}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-[13px] bg-surface outline-none focus:border-accent placeholder:text-text-tertiary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-3 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-text-tertiary mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
