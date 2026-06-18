import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function ChipButton({ className, active = false, children, ...props }: ChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary/60 bg-primary/15 text-foreground shadow-soft'
          : 'border-border bg-background/70 text-muted-foreground hover:border-primary/40 hover:bg-muted/80 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
