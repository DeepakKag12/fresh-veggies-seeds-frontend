import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { getProductImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../utils/imageFallback';

/**
 * Amazon / Sephora Benchmark:
 * 300ms Debounced Instant Typeahead Search with Highlighted Query Matches
 */
const highlightMatch = (text = '', query = '') => {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="font-extrabold text-[#0A4D3C] bg-emerald-100/60 dark:bg-emerald-900/60 px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const SearchAutocomplete = ({
  placeholder = 'Search fresh seeds, vegetable plants, organic fertilizers, planters…',
  className = '',
  inputClassName = '',
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState({ products: [], terms: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 300ms Debounce Timer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions({ products: [], terms: [] });
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api.get(`/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          setSuggestions({
            products: res.data.products || [],
            terms: res.data.terms || [],
          });
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    onClose?.();
    navigate(`/?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectProduct = (productId) => {
    setIsOpen(false);
    onClose?.();
    navigate(`/product/${productId}`);
  };

  const handleSelectTerm = (term) => {
    setQuery(term);
    setIsOpen(false);
    onClose?.();
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  const hasSuggestions = suggestions.products.length > 0 || suggestions.terms.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} role="search" className="relative flex items-center">
        <Search className="pointer-events-none absolute left-4 h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#0A4C36]/70" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`h-11 sm:h-12 w-full rounded-[50px] bg-[#F4E6C6]/60 border border-[#E8D7B8] pl-12 pr-11 text-[14px] sm:text-[15px] text-[#0A4C36] shadow-2xs
                     placeholder:text-[#0A4C36]/60 focus:bg-white focus:border-[#0A4C36] focus:outline-none focus:ring-2 focus:ring-[#0A4C36]/20 transition-all ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions({ products: [], terms: [] });
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-full text-fv-primary/60 hover:text-fv-primary hover:bg-[#E8D7B8]/40 focus:outline-none transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown Overlay */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-fv-border bg-white dark:bg-gray-800 shadow-xl overflow-hidden backdrop-blur-md animate-fadeIn">
          {loading && (
            <div className="px-4 py-3 text-xs text-fv-muted flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-fv-primary border-t-transparent rounded-full animate-spin" />
              Searching botanical catalog…
            </div>
          )}

          {!loading && !hasSuggestions && (
            <div className="px-5 py-4 text-center">
              <p className="text-xs text-fv-muted">No direct suggestions for "{query}"</p>
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-fv-primary hover:underline"
              >
                Search all products for "{query}" <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!loading && hasSuggestions && (
            <div className="py-2 divide-y divide-gray-100 dark:divide-gray-700/60 max-h-[420px] overflow-y-auto">
              {/* Popular Query Terms */}
              {suggestions.terms.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Suggested Keywords
                  </div>
                  {suggestions.terms.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTerm(term)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-fv-primary" />
                        <span>{highlightMatch(term, query)}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-fv-primary" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Matches with Thumbnails and Prices */}
              {suggestions.products.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3 text-fv-primary" /> Matching Products
                  </div>
                  <div className="space-y-1 mt-1">
                    {suggestions.products.map((prod) => {
                      const image = getProductImageUrl(prod);
                      return (
                        <div
                          key={prod._id}
                          onClick={() => handleSelectProduct(prod._id)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors group"
                        >
                          <img
                            src={image}
                            alt={prod.name}
                            onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                            className="w-11 h-11 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200/60 dark:border-gray-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-fv-primary">
                              {highlightMatch(prod.name, query)}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.categoryId?.name && (
                                <span className="text-[10px] text-gray-500 font-medium truncate">
                                  {prod.categoryId.name}
                                </span>
                              )}
                              <span className="text-xs font-bold text-[#0A4D3C] dark:text-emerald-400">
                                ₹{prod.price}
                              </span>
                              {prod.originalPrice > prod.price && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{prod.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-fv-primary shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View All Results Footer */}
              <div className="p-2 bg-gray-50/80 dark:bg-gray-800/80">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  View all results for "{query}" <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
