import React, { useMemo } from 'react';
import { Check, Sparkles, AlertCircle, TrendingDown } from 'lucide-react';
import { extractQuantityCount, calculateComparativeSavings } from '../../utils/pricing-engine';

/**
 * Costco / BulkSupplements / BigBasket Benchmark Variant & Packet Size Picker (FEAT-005 / FEAT-006)
 * - Automatic Proportional Variant Pricing Engine integration
 * - Comparative unit-cost calculation (e.g. ₹24/100g vs ₹19/100g)
 * - Volume discount savings badge ("Save 20% on 1kg" vs base unit rate)
 * - Selectable out-of-stock variants with urgency ticker & notify me trigger
 */

// Helper to compute unit economics (Costco/BigBasket style price breakdown)
const calculateUnitEconomics = (quantityStr, price) => {
  if (!quantityStr || !price || price <= 0) return null;

  // Weight parsing: kg or grams
  const kgMatch = quantityStr.match(/(\d+(\.\d+)?)\s*(?:kg|kilo|kilograms?)/i);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (kg > 0) {
      const perKg = Math.round(price / kg);
      return `₹${perKg.toLocaleString('en-IN')}/kg`;
    }
  }

  const gmMatch = quantityStr.match(/(\d+(\.\d+)?)\s*(?:g|gm|grams?)/i);
  if (gmMatch) {
    const grams = parseFloat(gmMatch[1]);
    if (grams > 0) {
      if (grams >= 1000) {
        const perKg = Math.round((price / grams) * 1000);
        return `₹${perKg.toLocaleString('en-IN')}/kg`;
      }
      const per100g = ((price / grams) * 100).toFixed(1);
      return `₹${per100g}/100g`;
    }
  }

  // Seed / count parsing
  const seedMatch = quantityStr.match(/(\d+)\s*(?:seeds?|pcs?|pieces?|count)/i);
  if (seedMatch) {
    const count = parseInt(seedMatch[1], 10);
    if (count > 0) {
      const perSeed = (price / count).toFixed(2);
      return `₹${perSeed}/seed`;
    }
  }

  return null;
};

const VariantPicker = ({ packages = [], selectedId, onSelect }) => {
  // Detect whether variants are predominantly weight or seed count
  const isWeightBased = useMemo(
    () => (packages && packages.length > 0 ? packages.some((p) => /g|gm|kg|gram/i.test(p?.quantity)) : false),
    [packages]
  );

  // Baseline tier: Smallest package size used as comparative benchmark (Costco style)
  const basePkg = useMemo(() => {
    if (!packages || !packages.length) return null;
    const sorted = [...packages].sort(
      (a, b) => extractQuantityCount(a?.quantity) - extractQuantityCount(b?.quantity)
    );
    return sorted[0];
  }, [packages]);

  // Identify the best-value package (highest discount percentage with discount > 0)
  const bestValuePkgId = useMemo(() => {
    if (!packages || !packages.length) return null;
    let maxDiscount = 0;
    let bestId = null;

    packages.forEach((pkg) => {
      const orig = pkg.originalPrice || 0;
      const cur = pkg.price || 0;
      if (orig > cur) {
        const disc = ((orig - cur) / orig) * 100;
        if (disc > maxDiscount) {
          maxDiscount = disc;
          bestId = pkg._id;
        }
      }
    });

    // If no explicit discounts, tag the largest packet as best volume value if > 1 option
    if (!bestId && packages.length > 1) {
      bestId = packages[packages.length - 1]._id;
    }
    return bestId;
  }, [packages]);

  if (!packages || !packages.length) return null;

  return (
    <fieldset className="mt-6" role="radiogroup" aria-label="Packet Size Options">
      <div className="flex items-center justify-between">
        <legend className="font-serif text-[17px] font-semibold text-fv-heading flex items-center gap-2">
          <span>{isWeightBased ? 'Select Packet Weight' : 'Select Seed Count / Pack Size'}</span>
        </legend>
        <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
          {packages.length} {packages.length === 1 ? 'Option' : 'Options'} Available
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {packages.map((pkg) => {
          const isOut = pkg.stock === 0;
          const isLow = pkg.stock > 0 && pkg.stock <= 5;
          const selected = pkg._id === selectedId;
          const isBestValue = pkg._id === bestValuePkgId && packages.length > 1;

          const price = pkg.price || 0;
          const orig = pkg.originalPrice || 0;
          const hasDiscount = orig > price;
          const discountPct = hasDiscount ? Math.round(((orig - price) / orig) * 100) : 0;
          const unitEconomics = calculateUnitEconomics(pkg.quantity, price);

          // Costco / BulkSupplements Comparative Volume Savings vs Base Unit
          const isBulkTier = basePkg && pkg._id !== basePkg._id;
          const volumeSavings = isBulkTier
            ? calculateComparativeSavings(price, pkg.quantity, basePkg.price, basePkg.quantity)
            : null;

          return (
            <label
              key={pkg._id}
              className={`relative flex min-h-[82px] cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 select-none ${
                isOut
                  ? selected
                    ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400'
                    : 'border-gray-200 bg-gray-50/80 hover:border-gray-300 opacity-75'
                  : selected
                  ? 'border-fv-primary bg-emerald-50/60 shadow-sm ring-2 ring-fv-primary dark:bg-emerald-950/30'
                  : 'border-fv-border bg-white dark:bg-gray-800 hover:border-fv-primary/60 hover:bg-gray-50/50'
              }`}
            >
              <input
                type="radio"
                name="pack-size"
                className="sr-only"
                checked={selected}
                onChange={() => onSelect(pkg)}
              />

              {/* Best Value Badge */}
              {isBestValue && !isOut && (
                <span className="absolute -top-2.5 right-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> Best Value
                </span>
              )}

              {/* Packet Title & Active Checkmark */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[14px] font-bold leading-tight ${
                    selected ? 'text-fv-primary dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'
                  } ${isOut ? 'line-through text-gray-400' : ''}`}
                >
                  {pkg.quantity}
                </span>
                {selected && (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
                      isOut ? 'bg-rose-500' : 'bg-fv-primary'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Pricing & Unit Economics */}
              <div className="mt-1.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className={`text-[14px] font-extrabold ${
                      selected ? 'text-fv-primary dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <s className="text-[11px] text-gray-400 font-normal">
                      ₹{orig.toLocaleString('en-IN')}
                    </s>
                  )}
                  {hasDiscount && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* Costco Comparative Unit Price Subtext */}
                {unitEconomics && (
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    ({unitEconomics})
                  </span>
                )}

                {/* Costco / BulkSupplements Comparative Volume Discount Badge */}
                {volumeSavings && volumeSavings.savingsPct > 0 && !isOut && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                    <TrendingDown className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Save {volumeSavings.savingsPct}% on bulk ({volumeSavings.unitSavingsText.split('(')[0].trim()})</span>
                  </div>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/60">
                {isOut ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                    Sold Out
                  </span>
                ) : isLow ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Only {pkg.stock} left
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default VariantPicker;
