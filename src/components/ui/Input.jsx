import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Text input with an associated label and an accessible error message.
 *
 * Accessibility wiring this component previously lacked:
 *   - the <label> had no htmlFor, so it was not associated with the input at
 *     all — clicking it did not focus the field and screen readers announced
 *     the input as unlabelled
 *   - the error text was visually adjacent but not programmatically linked, so
 *     assistive tech never read it out with the field
 *   - nothing announced the error when it appeared
 *
 * Now: label/input paired via a generated id, error linked with
 * aria-describedby, aria-invalid set, and the message given role="alert" so it
 * is announced. The warning glyph is decorative and hidden from the a11y tree.
 */
const Input = React.forwardRef(({ className, type, error, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || `input-${generatedId}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-fv-heading mb-1.5">
          {label}
          {props.required && <span className="text-fv-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'flex h-11 w-full rounded-[10px] border border-fv-border bg-white px-4 py-2 text-sm',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-fv-primary focus:border-transparent',
          'placeholder:text-fv-muted',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-fv-danger focus:ring-fv-danger',
          className
        )}
        ref={ref}
        {...props}
      />
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
});

Input.displayName = 'Input';

export default Input;
