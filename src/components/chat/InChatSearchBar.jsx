import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

/**
 * WhatsApp Web Style In-Chat Message Search Overlay Bar
 */
export const InChatSearchBar = ({
  searchQuery,
  onSearchChange,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClose
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          onPrevMatch();
        } else {
          onNextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextMatch, onPrevMatch]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-fv-border px-3 py-2 flex items-center gap-2 shadow-xs z-20 shrink-0 animate-fadeIn">
      <Search className="w-4 h-4 text-fv-muted shrink-0 ml-1" />

      <input
        ref={inputRef}
        type="text"
        placeholder="Search in this chat..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 text-xs sm:text-sm bg-transparent border-none text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none"
      />

      {/* Match Counter Badge */}
      {searchQuery.trim() && (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
          {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No matches'}
        </span>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onPrevMatch}
          disabled={matchCount <= 1}
          className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous match (Shift + Enter)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNextMatch}
          disabled={matchCount <= 1}
          className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next match (Enter)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Close Search */}
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 transition-colors cursor-pointer"
        title="Close Search (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Text Highlighter Utility Component
 */
export const HighlightedText = ({ text, highlight, isCurrentMatch }) => {
  if (!highlight || !highlight.trim() || !text) {
    return <span>{text}</span>;
  }

  const query = highlight.trim();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={`font-semibold px-0.5 rounded transition-colors ${
              isCurrentMatch
                ? 'bg-amber-400 text-black dark:bg-amber-300 dark:text-black ring-2 ring-amber-500'
                : 'bg-yellow-200 text-black dark:bg-yellow-600/80 dark:text-white'
            }`}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default InChatSearchBar;
