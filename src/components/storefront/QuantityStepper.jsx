import React from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Quantity control. The value is a real number input (not just +/- buttons) so
 * it can be typed into and read by assistive tech, and it is clamped to the
 * stock actually available for the selected pack.
 */
const QuantityStepper = ({ value, onChange, max = 99 }) => {
  const clamp = (n) => Math.min(Math.max(1, n), Math.max(1, max));

  return (
    <div className="flex h-12 items-center rounded-[50px] border border-fv-border bg-white">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="flex h-12 w-12 items-center justify-center rounded-l-[50px] text-fv-primary
                   disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>

      <label htmlFor="qty" className="sr-only">Quantity</label>
      <input
        id="qty"
        type="number"
        inputMode="numeric"
        min="1"
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
        className="h-12 w-10 border-0 bg-transparent text-center text-[15px] font-medium text-fv-heading
                   [appearance:textfield] focus:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                   [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-12 w-12 items-center justify-center rounded-r-[50px] text-fv-primary
                   disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default QuantityStepper;
