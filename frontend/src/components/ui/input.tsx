import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground lg:h-10',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
