import React from 'react';

/**
 * Pack-size chooser backed by the product's real `packages[]`. Renders nothing
 * when a product has no packages, so a simple product never shows an empty
 * control. Out-of-stock packs stay visible but are disabled and labelled —
 * hiding them would make the range look smaller than it is.
 */
const VariantPicker = ({ packages = [], selectedId, onSelect }) => {
  if (!packages.length) return null;

  return (
    <fieldset className="mt-6">
      <legend className="font-serif text-[18px] font-semibold text-fv-heading">Select pack size</legend>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {packages.map((pkg) => {
          const isOut = pkg.stock === 0;
          const selected = pkg._id === selectedId;
          return (
            <label
              key={pkg._id}
              className={`relative flex min-h-[58px] cursor-pointer flex-col items-center justify-center rounded-[12px] border px-3 py-2.5 text-center
                          transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]
                          ${isOut ? 'cursor-not-allowed border-fv-border bg-fv-surface opacity-60' : ''}
                          ${selected ? 'border-fv-primary bg-fv-primary text-white shadow-xs' : 'border-fv-border bg-white text-fv-heading hover:border-fv-primary'}`}
            >
              <input
                type="radio"
                name="pack-size"
                className="sr-only"
                checked={selected}
                disabled={isOut}
                onChange={() => onSelect(pkg)}
              />
              <span className="text-[13px] sm:text-[14px] font-semibold leading-tight">{pkg.quantity}</span>
              <span className={`text-[12px] sm:text-[14px] mt-0.5 ${selected ? 'text-white/90' : 'text-fv-muted'}`}>
                ₹{pkg.price.toLocaleString('en-IN')}
              </span>
              {isOut && <span className="mt-1 text-[10px] font-semibold uppercase text-fv-danger">Sold out</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default VariantPicker;
