import React, { useState } from 'react';
import { History, Trash2, CheckSquare, Square } from 'lucide-react';

export const OrderHistoryTimeline = ({
  orderId,
  statusHistory = [],
  onPromptDeleteHistory,
  onPromptBulkDeleteHistory,
}) => {
  const [selectedHistories, setSelectedHistories] = useState(new Set());

  const toggleHistorySelection = (historyId) => {
    setSelectedHistories(prev => {
      const next = new Set(prev);
      if (next.has(historyId)) next.delete(historyId);
      else next.add(historyId);
      return next;
    });
  };

  const toggleSelectAllHistories = () => {
    const allIds = statusHistory.map(h => h._id).filter(Boolean);
    if (selectedHistories.size === allIds.length) {
      setSelectedHistories(new Set());
    } else {
      setSelectedHistories(new Set(allIds));
    }
  };

  const handleBulkDelete = () => {
    if (selectedHistories.size === 0) return;
    onPromptBulkDeleteHistory(orderId, Array.from(selectedHistories));
    setSelectedHistories(new Set());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-fv-heading uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-fv-primary" /> Status History & Audit Trail ({statusHistory.length})
        </h4>

        {statusHistory.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllHistories}
              className="text-xs text-fv-muted hover:text-fv-heading flex items-center gap-1 px-2 py-1.5 rounded-lg border border-fv-border min-h-[36px]"
            >
              {selectedHistories.size === statusHistory.length && statusHistory.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-fv-primary" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All</span>
            </button>

            {selectedHistories.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedHistories.size})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {statusHistory.length > 0 ? (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {statusHistory.slice().reverse().map((h, idx) => {
            const isSelected = selectedHistories.has(h._id);
            return (
              <div
                key={h._id || idx}
                className={`text-xs flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                    : 'bg-fv-surface/40 border-fv-border/60 hover:bg-fv-surface/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {h._id && (
                    <button
                      type="button"
                      onClick={() => toggleHistorySelection(h._id)}
                      className="text-fv-muted hover:text-fv-heading flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label="Select history item"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-fv-heading">
                      <span>{h.status}</span>
                      {h.from && (
                        <span className="text-fv-muted flex items-center gap-1 text-[11px]">
                          (from {h.from})
                        </span>
                      )}
                    </div>
                    {h.note && <p className="text-fv-muted italic text-[11px] mt-0.5">{h.note}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-fv-muted whitespace-nowrap">
                    {new Date(h.changedAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {h._id && (
                    <button
                      type="button"
                      onClick={() => onPromptDeleteHistory(orderId, h._id)}
                      className="p-1.5 text-fv-muted hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete this history entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-fv-muted italic py-2">No history logs recorded for this order yet.</p>
      )}
    </div>
  );
};

export default OrderHistoryTimeline;
