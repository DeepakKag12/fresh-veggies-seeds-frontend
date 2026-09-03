import React from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

/** Hairline-bounded control row above the product grid. */
const DEFAULT_OPTIONS = [
  { value: 'featured', label: 'Sort by' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const FilterSortBar = ({ count, sort, onSortChange, onOpenFilter, filtersOpen, options = DEFAULT_OPTIONS }) => (
  <div className="bg-fv-page px-4 sm:px-6 lg:px-10">
    <div className="mx-auto flex max-w-[1500px] items-center justify-between border-y border-fv-border py-3">
      <button
        type="button"
        onClick={onOpenFilter}
        aria-expanded={filtersOpen}
        className="inline-flex h-11 items-center gap-2 rounded-[50px] px-3 text-[14px] font-medium
                   tracking-wide text-fv-heading hover:bg-white focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-fv-primary"
      >
        <SlidersHorizontal className="h-4 w-4 text-fv-primary" aria-hidden="true" />
        FILTER
      </button>

      {typeof count === 'number' && (
        <p aria-live="polite" className="hidden text-[14px] text-fv-muted sm:block">
          {count} {count === 1 ? 'product' : 'products'}
        </p>
      )}

      <div className="relative">
        <label htmlFor="sort-by" className="sr-only">Sort products by</label>
        <select
          id="sort-by"
          value={sort}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="h-11 cursor-pointer appearance-none rounded-[50px] bg-transparent pl-3 pr-8
                     text-[14px] text-fv-heading hover:bg-white focus:outline-none focus-visible:ring-2
                     focus-visible:ring-fv-primary"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fv-heading" aria-hidden="true" />
      </div>
    </div>
  </div>
);

export default FilterSortBar;
