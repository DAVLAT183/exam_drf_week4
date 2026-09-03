'use client';

import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full bg-surface-card border rounded-btn px-4 py-3 text-sm text-text-primary resize-y min-h-[100px]',
            'placeholder:text-text-muted focus:outline-none transition-all duration-150',
            error
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/15'
              : 'border-border-default focus:border-accent focus:ring-2 focus:ring-accent/15',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
