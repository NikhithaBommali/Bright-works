import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn('mb-2 block text-sm font-medium text-foreground', className)} {...props}>
      {children}
    </label>
  );
}
