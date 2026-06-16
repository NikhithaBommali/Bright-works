import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface CollapsibleProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Collapsible({ title, open, onToggle, children }: CollapsibleProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-secondary/40">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}
