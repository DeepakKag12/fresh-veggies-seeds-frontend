import React, { useState } from 'react';
import { X, Star, RotateCcw, Filter, ChevronDown, ChevronUp, Sparkles, Sun, Snowflake, CloudRain } from 'lucide-react';

/**
 * Amazon / Sephora Benchmark:
 * Faceted Filter Drawer & Sidebar Panel
 * Features:
 * - Multi-select category checkboxes
 * - Dual-handle price slider / input range with preset quick pills
 * - Seasonal freshness checkboxes
 * - Customer rating radio options
 * - "In Stock Only" toggle switch
 */
const PRICE_PRESETS = [
  { label: 'Under ₹100', min: 0, max: 100 },
  { label: '₹100 - ₹250', min: 100, max: 250 },
  { label: '₹250 - ₹500', min: 250, max: 500 },
  { label: 'Over ₹500', min: 500, max: '' },
];

const SEASONS = [
  { id: 'Summer', label: 'Summer', icon: Sun, color: 'text-amber-500' },
  { id: 'Winter', label: 'Winter', icon: Snowflake, color: 'text-blue-400' },
  { id: 'Monsoon', label: 'Monsoon', icon: CloudRain, color: 'text-cyan-500' },
  { id: 'All Season', label: 'All Season', icon: Sparkles, color: 'text-emerald-500' },
];

const RATINGS = [
  { value: 4, label: '4★ & above' },
  { value: 3, label: '3★ & above' },
  { value: 2, label: '2★ & above' },
];

const FacetFilterSidebar = ({
  filters,
  categories = [],
  onChange,
  onReset,
  isOpen,
  onClose,
  totalCount,
}) => {
  const [collapsedSections, setCollapsedSections] = useState({
    categories: false,
    price: false,
    season: false,
    rating: false,
    stock: false,
  });

  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || '');

  const toggleSection = (sec) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Category multi-select helper
  const selectedCategories = Array.isArray(filters.category)
    ? filters.category
    : filters.category
    ? String(filters.category).split(',').filter(Boolean)
    : [];

  const handleCategoryToggle = (catId) => {
    let next;
    if (selectedCategories.includes(catId)) {
      next = selectedCategories.filter((id) => id !== catId);
    } else {
      next = [...selectedCategories, catId];
    }
    onChange('category', next.length > 0 ? next.join(',') : '');
  };

  const handleApplyPrice = (min, max) => {
    onChange('minPrice', min !== undefined ? min : minPriceInput);
    onChange('maxPrice', max !== undefined ? max : maxPriceInput);
  };

  const handlePricePreset = (preset) => {
    setMinPriceInput(preset.min ? String(preset.min) : '');
    setMaxPriceInput(preset.max ? String(preset.max) : '');
    onChange('minPrice', preset.min ? String(preset.min) : '');
    onChange('maxPrice', preset.max ? String(preset.max) : '');
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Catalogue Filters"
      className="border-b border-fv-border bg-white dark:bg-gray-800 transition-all duration-300 shadow-sm"
    >
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-fv-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Filter Products
            </h2>
            {typeof totalCount === 'number' && (
              <span className="text-xs text-fv-muted font-medium">({totalCount} items)</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Facet Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-5">
          {/* 1. Category Multi-Select Checkboxes */}
          <div>
            <div
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer mb-2.5"
            >
              <span>Categories</span>
              {collapsedSections.categories ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
            {!collapsedSections.categories && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 [scrollbar-width:thin]">
                {categories.map((cat) => {
                  const catId = cat._id || cat.slug;
                  const isChecked = selectedCategories.includes(String(catId)) || selectedCategories.includes(cat.slug);
                  return (
                    <label
                      key={catId}
                      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-fv-primary cursor-pointer select-none py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(catId)}
                        className="rounded border-gray-300 text-fv-primary focus:ring-fv-primary h-4 w-4"
                      />
                      <span className={`truncate ${isChecked ? 'font-bold text-fv-primary' : 'font-normal'}`}>
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Dual Price Range & Quick Presets */}
          <div>
            <div
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer mb-2.5"
            >
              <span>Price Budget</span>
              {collapsedSections.price ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
            {!collapsedSections.price && (
              <div className="space-y-3">
                {/* Min / Max Inputs */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      onBlur={() => handleApplyPrice(minPriceInput, maxPriceInput)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-6 pr-2 text-xs focus:border-fv-primary focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-400 text-xs">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      onBlur={() => handleApplyPrice(minPriceInput, maxPriceInput)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-6 pr-2 text-xs focus:border-fv-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPrice(minPriceInput, maxPriceInput)}
                    className="px-2.5 py-1.5 rounded-lg bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-semibold cursor-pointer"
                  >
                    Go
                  </button>
                </div>

                {/* Preset Range Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePricePreset(p)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:border-fv-primary hover:text-fv-primary transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Seasonality */}
          <div>
            <div
              onClick={() => toggleSection('season')}
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer mb-2.5"
            >
              <span>Growing Season</span>
              {collapsedSections.season ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
            {!collapsedSections.season && (
              <div className="space-y-1.5">
                {SEASONS.map((s) => {
                  const isSelected = filters.season === s.id;
                  const Icon = s.icon;
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-fv-primary cursor-pointer select-none py-0.5"
                    >
                      <input
                        type="radio"
                        name="season_filter"
                        checked={isSelected}
                        onChange={() => onChange('season', isSelected ? '' : s.id)}
                        onClick={() => {
                          if (isSelected) onChange('season', '');
                        }}
                        className="rounded-full border-gray-300 text-fv-primary focus:ring-fv-primary h-4 w-4"
                      />
                      <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <span className={isSelected ? 'font-bold text-fv-primary' : 'font-normal'}>
                        {s.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Rating & Stock Availability */}
          <div>
            <div
              onClick={() => toggleSection('stock')}
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer mb-2.5"
            >
              <span>Availability & Rating</span>
              {collapsedSections.stock ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
            {!collapsedSections.stock && (
              <div className="space-y-3">
                {/* In Stock Only Switch */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200/80 dark:border-gray-700 cursor-pointer">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    In Stock Only
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.inStock === true || filters.inStock === 'true'}
                    onChange={(e) => onChange('inStock', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-fv-primary focus:ring-fv-primary cursor-pointer"
                  />
                </label>

                {/* Minimum Ratings */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Customer Rating
                  </span>
                  {RATINGS.map((r) => {
                    const isSelected = Number(filters.rating) === r.value;
                    return (
                      <label
                        key={r.value}
                        className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-fv-primary cursor-pointer select-none py-0.5"
                      >
                        <input
                          type="radio"
                          name="rating_filter"
                          checked={isSelected}
                          onChange={() => onChange('rating', isSelected ? '' : r.value)}
                          onClick={() => {
                            if (isSelected) onChange('rating', '');
                          }}
                          className="h-3.5 w-3.5 text-fv-primary focus:ring-fv-primary"
                        />
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: r.value }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {r.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FacetFilterSidebar;
