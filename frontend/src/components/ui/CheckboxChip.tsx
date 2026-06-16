import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxChipProps {
  checked: boolean;
  label: ReactNode;
  onToggle: () => void;
}

export function CheckboxChip({ checked, label, onToggle }: CheckboxChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked
          ? 'border-primary bg-primary/15 text-foreground shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-full border',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
        )}
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
