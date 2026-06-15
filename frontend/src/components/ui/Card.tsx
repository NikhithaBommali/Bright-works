import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card/85 text-card-foreground shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
