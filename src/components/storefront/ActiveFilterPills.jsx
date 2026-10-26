import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * Amazon / Sephora Benchmark: Removable Active Filter Chips & Clear All Bar
 */
const ActiveFilterPills = ({
  filters,
  categories = [],
  onRemoveFilter,
  onClearAll,
}) => {
  const pills = [];

  // 1. Search Query Pill
  if (filters.search) {
    pills.push({
      id: 'search',
      label: `"${filters.search}"`,
      prefix: 'Search:',
      onRemove: () => onRemoveFilter('search', ''),
    });
  }

  // 2. Categories Pill(s)
  if (filters.category) {
    const catList = Array.isArray(filters.category)
      ? filters.category
      : String(filters.category).split(',').filter(Boolean);

    catList.forEach((catVal) => {
      const match = categories.find((c) => String(c._id) === String(catVal) || c.slug === catVal || c.name === catVal);
      const label = match ? match.name : catVal;
      pills.push({
        id: `cat-${catVal}`,
        label,
        prefix: 'Category:',
        onRemove: () => {
          if (catList.length <= 1) {
            onRemoveFilter('category', '');
          } else {
            onRemoveFilter('category', catList.filter((c) => c !== catVal));
          }
        },
      });
    });
  }

  // 3. Price Range Pill
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `₹${filters.minPrice}` : '₹0';
    const max = filters.maxPrice ? `₹${filters.maxPrice}` : '₹5,000+';
    pills.push({
      id: 'price',
      label: `${min} - ${max}`,
      prefix: 'Price:',
      onRemove: () => {
        onRemoveFilter('minPrice', '');
        onRemoveFilter('maxPrice', '');
      },
    });
  }

  // 4. Season Pill
  if (filters.season) {
    pills.push({
      id: 'season',
      label: filters.season,
      prefix: 'Season:',
      onRemove: () => onRemoveFilter('season', ''),
    });
  }

  // 5. Rating Pill
  if (filters.rating) {
    pills.push({
      id: 'rating',
      label: `${filters.rating}★ & up`,
      prefix: 'Rating:',
      onRemove: () => onRemoveFilter('rating', ''),
    });
  }

  // 6. In Stock Only Pill
  if (filters.inStock === true || filters.inStock === 'true') {
    pills.push({
      id: 'inStock',
      label: 'In Stock Only',
      prefix: '',
      onRemove: () => onRemoveFilter('inStock', false),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="bg-fv-page px-4 sm:px-6 lg:px-10 pt-3 pb-1">
      <div className="mx-auto max-w-[1500px] flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
          Active Filters:
        </span>

        {pills.map((pill) => (
          <span
            key={pill.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/60 text-gray-800 dark:text-gray-200 shadow-2xs group"
          >
            {pill.prefix && <span className="text-gray-400 font-normal">{pill.prefix}</span>}
            <span className="font-semibold text-fv-primary">{pill.label}</span>
            <button
              type="button"
              onClick={pill.onRemove}
              className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label={`Remove filter for ${pill.label}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ActiveFilterPills;
