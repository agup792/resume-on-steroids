"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1 bg-surface-alt rounded-2xl rounded-bl-sm px-4 py-2.5">
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
      </div>
    </div>
  );
}
