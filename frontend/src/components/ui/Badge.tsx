import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'soft';
}

export function Badge({ children, tone = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'default' && 'bg-secondary text-secondary-foreground',
        tone === 'accent' && 'bg-primary/15 text-foreground',
        tone === 'soft' && 'bg-accent/15 text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
