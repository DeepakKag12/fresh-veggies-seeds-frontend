import React from 'react';
import { cn } from '../../lib/utils';

/**
 * The button for the whole application — storefront and admin alike.
 *
 * Geometry matches the storefront: pill radius, 44px+ height so every button
 * clears the 24×24 minimum target with room to spare, and a visible focus ring
 * on keyboard focus only.
 */
const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-[50px] font-semibold transition-colors duration-200 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:pointer-events-none motion-reduce:transition-none';

    const variants = {
      default: 'bg-fv-primary text-white hover:bg-fv-primary-dark',
      // Yellow on deep green is the storefront's highlight pairing.
      accent: 'bg-fv-yellow text-fv-primary hover:brightness-95',
      outline: 'border border-fv-primary text-fv-primary hover:bg-fv-primary hover:text-white',
      ghost: 'text-fv-primary hover:bg-fv-surface',
      subtle: 'bg-fv-cream text-fv-primary hover:bg-fv-border/40',
      destructive: 'bg-fv-danger text-white hover:brightness-90 focus-visible:ring-fv-danger',
    };

    const sizes = {
      default: 'h-11 px-6 text-[15px]',
      sm: 'h-9 px-4 text-[14px]',
      lg: 'h-12 px-8 text-[16px]',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button
        className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
