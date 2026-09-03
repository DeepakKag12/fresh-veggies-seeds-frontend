import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Shared pagination control.
 *
 * Several lists used to request `?limit=100` and render whatever came back. The
 * API caps page size well below that, so the extra records were silently
 * dropped — an admin with 60 products could only ever see 50 of them, with no
 * indication the rest existed. These lists now page through the API properly.
 */
const Pagination = ({ page, totalPages, total, onPageChange, itemLabel = 'items' }) => {
  if (!totalPages || totalPages <= 1) {
    return total ? (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
        {total} {itemLabel}
      </p>
    ) : null;
  }

  // A compact window around the current page rather than every page number.
  const pages = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, from + 4);
  for (let i = Math.max(1, to - 4); i <= to; i++) pages.push(i);

  // Sized for touch: 44px on mobile (iOS/Android guidance), 36px from sm: up
  // where a pointer is likely. Comfortably above the WCAG 2.2 AA 24px minimum.
  const btn =
    'inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] ' +
    'px-3 rounded-lg text-sm font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ' +
    'dark:focus-visible:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
        Page {page} of {totalPages}
        {total !== undefined && <span> · {total} {itemLabel}</span>}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'bg-green-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
