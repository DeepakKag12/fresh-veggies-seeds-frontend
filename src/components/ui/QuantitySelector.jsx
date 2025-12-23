import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const QuantitySelector = ({ 
  label = "Quantity", 
  value, 
  onChange, 
  options = [],
  className,
  error 
}) => {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "block w-full h-12 px-4 py-3 text-base",
            "bg-white border-2 border-gray-300 rounded-lg",
            "appearance-none cursor-pointer",
            "text-gray-900 font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500",
            "hover:border-gray-400",
            error && "border-red-500 focus:ring-red-100 focus:border-red-500"
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.length === 0 ? (
            <option value="">Choose an option</option>
          ) : (
            options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="py-3"
              >
                {option.label}
              </option>
            ))
          )}
        </select>
        <ChevronDown 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
          strokeWidth={2}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
};

export default QuantitySelector;
