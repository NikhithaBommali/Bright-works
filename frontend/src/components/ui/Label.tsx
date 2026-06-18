import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('mb-2 block text-sm font-medium text-foreground', className)} {...props} />;
}
