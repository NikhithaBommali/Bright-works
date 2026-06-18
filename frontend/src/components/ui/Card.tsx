import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('glass-panel p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}
