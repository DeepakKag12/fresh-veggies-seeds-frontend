import React from 'react';

/**
 * Botanical Skeleton Shimmer Grid (BigBasket / Nature's Basket benchmark)
 * Provides instant visual feedback with zero layout shifts during catalog load.
 */
const ProductSkeletonGrid = ({ count = 8, viewMode = 'grid' }) => {
  const items = Array.from({ length: count });

  if (viewMode === 'list') {
    return (
      <div className="space-y-3.5" role="status" aria-label="Loading products">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse shadow-2xs"
          >
            {/* Image Placeholder */}
            <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />

            {/* Content Placeholders */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="h-3 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40" />
              <div className="h-5 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded-md bg-gray-100 dark:bg-gray-700/60" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Price & Action Placeholder */}
            <div className="w-full sm:w-44 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
              <div className="h-6 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-9 w-28 rounded-full bg-emerald-200 dark:bg-emerald-900/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {items.map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-[18px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse shadow-2xs"
        >
          {/* Image Box */}
          <div className="aspect-square w-full bg-gray-200 dark:bg-gray-700 relative">
            <div className="absolute top-2.5 left-2.5 h-4 w-16 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col p-3 sm:p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="h-2.5 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40" />
              <div className="h-2.5 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-4 w-5/6 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-4/6 rounded-md bg-gray-100 dark:bg-gray-700/60" />

            <div className="flex gap-1.5 pt-1">
              <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-14 rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Bottom Price & Button */}
            <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
              <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-16 rounded-full bg-emerald-200 dark:bg-emerald-900/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeletonGrid;
