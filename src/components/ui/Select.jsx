import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(
  ({ className, label, error, options = [], value, onChange, placeholder, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-fv-heading mb-1.5">
            {label}
            {props.required && <span className="text-fv-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex h-11 w-full rounded-[10px] border border-fv-border bg-white px-4 py-2 pr-10 text-sm',
              'transition-all duration-200 appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-fv-primary focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-fv-danger focus:ring-fv-danger',
              className
            )}
            value={value}
            onChange={onChange}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fv-muted pointer-events-none" />
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-fv-danger flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
