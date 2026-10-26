import React from 'react';
import { SlidersHorizontal, ChevronDown, LayoutGrid, List } from 'lucide-react';

/** Hairline-bounded control row above the product grid. */
const DEFAULT_OPTIONS = [
  { value: 'featured', label: 'Sort by' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const FilterSortBar = ({
  count,
  sort,
  onSortChange,
  onOpenFilter,
  filtersOpen,
  options = DEFAULT_OPTIONS,
  viewMode = 'grid',
  onViewModeChange
}) => (
  <div className="bg-fv-page px-4 sm:px-6 lg:px-10">
    <div className="mx-auto flex max-w-[1500px] items-center justify-between border-y border-fv-border py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilter}
          aria-expanded={filtersOpen}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 text-xs sm:text-sm font-semibold
                     tracking-wide text-fv-heading dark:text-gray-200 hover:border-fv-primary focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-fv-primary transition-all shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-fv-primary" aria-hidden="true" />
          FILTER
        </button>

        {/* BigBasket / Nature's Basket Grid / List Layout Switcher */}
        {onViewModeChange && (
          <div className="flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-fv-primary text-white shadow-2xs'
                  : 'text-gray-500 hover:text-fv-primary dark:text-gray-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List View"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-fv-primary text-white shadow-2xs'
                  : 'text-gray-500 hover:text-fv-primary dark:text-gray-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {typeof count === 'number' && (
        <p aria-live="polite" className="hidden text-[13px] font-medium text-fv-muted sm:block">
          {count} {count === 1 ? 'product' : 'products'} available
        </p>
      )}

      <div className="relative">
        <label htmlFor="sort-by" className="sr-only">Sort products by</label>
        <select
          id="sort-by"
          value={sort}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="h-10 cursor-pointer appearance-none rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-3.5 pr-8
                     text-xs sm:text-sm font-semibold text-fv-heading dark:text-gray-200 hover:border-fv-primary focus:outline-none focus-visible:ring-2
                     focus-visible:ring-fv-primary transition-all shadow-2xs"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      </div>
    </div>
  </div>
);

export default FilterSortBar;
