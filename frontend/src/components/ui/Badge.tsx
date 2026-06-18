import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        variant === 'default'
          ? 'bg-primary/15 text-primary'
          : variant === 'outline'
            ? 'border border-border bg-background/70 text-foreground'
            : 'bg-secondary text-secondary-foreground',
        className
      )}
      {...props}
    />
  );
}
