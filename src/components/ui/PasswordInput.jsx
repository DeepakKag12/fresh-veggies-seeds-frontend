import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const PasswordInput = React.forwardRef(
  ({ className, label, error, showStrengthIndicator, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);

    // Pair the label with the input and link the error/strength text to it, so
    // assistive tech announces them together with the field.
    const generatedId = React.useId();
    const inputId = id || `password-${generatedId}`;
    const errorId = `${inputId}-error`;
    const strengthId = `${inputId}-strength`;

    const calculateStrength = (password) => {
      let score = 0;
      if (!password) return 0;

      // Length check
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;

      // Character variety
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      return Math.min(score, 4);
    };

    const handleChange = (e) => {
      if (showStrengthIndicator) {
        setStrength(calculateStrength(e.target.value));
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-fv-heading mb-1.5">
            {label}
            {props.required && <span className="text-fv-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              [error ? errorId : null, showStrengthIndicator && props.value ? strengthId : null]
                .filter(Boolean).join(' ') || undefined
            }
            className={cn(
              'flex h-11 w-full rounded-[10px] border border-fv-border bg-white px-4 py-2 pr-11 text-sm',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-fv-primary focus:border-transparent',
              'placeholder:text-fv-muted',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-fv-danger focus:ring-fv-danger',
              className
            )}
            ref={ref}
            {...props}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls={inputId}
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                       w-9 h-9 rounded-md text-fv-muted hover:text-fv-heading transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
          >
            {showPassword
              ? <EyeOff className="w-5 h-5" aria-hidden="true" />
              : <Eye className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        {showStrengthIndicator && props.value && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1" aria-hidden="true">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    index < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            {strength > 0 && (
              <p id={strengthId} aria-live="polite" className="text-xs text-fv-muted">
                Password strength: <span className="font-medium">{strengthLabels[strength - 1]}</span>
              </p>
            )}
          </div>
        )}

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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
