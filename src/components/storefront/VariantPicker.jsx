import React from 'react';
import { Check } from 'lucide-react';

/**
 * Ugaoo-Inspired Variant & Package Size Picker
 * - Clearly supports both weight variants (e.g. 8 gm, 25 gm, 100 gm, 250 gm)
 *   and count variants (e.g. 50 Seeds, 100 Seeds, 250 Seeds)
 * - Highlights stock status (In stock vs Sold out)
 * - Displays active checkmark and clear price tags
 */
const VariantPicker = ({ packages = [], selectedId, onSelect }) => {
  if (!packages || !packages.length) return null;

  // Detect whether variants are predominantly weight or seed count
  const isWeightBased = packages.some((p) => /g|gm|kg|gram/i.test(p.quantity));

  return (
    <fieldset className="mt-6">
      <div className="flex items-center justify-between">
        <legend className="font-serif text-[17px] font-semibold text-fv-heading">
          {isWeightBased ? 'Select Packet Weight' : 'Select Seed Count / Pack Size'}
        </legend>
        <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
          {packages.length} {packages.length === 1 ? 'Option' : 'Options'} Available
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {packages.map((pkg) => {
          const isOut = pkg.stock === 0;
          const selected = pkg._id === selectedId;

          return (
            <label
              key={pkg._id}
              className={`relative flex min-h-[64px] cursor-pointer flex-col justify-center rounded-[14px] border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                isOut
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50/60 opacity-60'
                  : selected
                  ? 'border-fv-primary bg-emerald-50/50 shadow-xs ring-1 ring-fv-primary'
                  : 'border-fv-border bg-white hover:border-fv-primary hover:bg-gray-50/40'
              }`}
            >
              <input
                type="radio"
                name="pack-size"
                className="sr-only"
                checked={selected}
                disabled={isOut}
                onChange={() => onSelect(pkg)}
              />

              <div className="flex items-center justify-between gap-1">
                <span className={`text-[14px] font-bold leading-tight ${selected ? 'text-fv-primary' : 'text-gray-900'}`}>
                  {pkg.quantity}
                </span>
                {selected && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-fv-primary text-white">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-[13px] font-semibold ${selected ? 'text-fv-primary' : 'text-gray-700'}`}>
                  ₹{pkg.price?.toLocaleString('en-IN')}
                </span>

                {isOut ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Sold Out
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 font-normal">
                    {pkg.stock <= 5 ? `${pkg.stock} left` : 'In stock'}
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
