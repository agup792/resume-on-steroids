"use client";

import { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4 py-1.5`}>
      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "bg-accent text-white rounded-br-sm"
              : "bg-surface-alt text-text rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {message.editSummary && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[11px] text-success font-medium">
              {message.editSummary}
            </span>
          </div>
        )}

        {message.clarification && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-[11px] text-warning font-medium">
              Needs your input
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
