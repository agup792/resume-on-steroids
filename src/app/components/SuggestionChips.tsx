"use client";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 text-xs font-medium bg-accent-light text-accent rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
