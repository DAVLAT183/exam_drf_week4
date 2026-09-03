'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-surface-card border rounded-btn px-4 py-3 text-sm text-text-primary',
              'placeholder:text-text-muted focus:outline-none transition-all duration-150',
              icon && 'pl-10',
              error
                ? 'border-error focus:border-error focus:ring-2 focus:ring-error/15'
                : 'border-border-default focus:border-accent focus:ring-2 focus:ring-accent/15',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
