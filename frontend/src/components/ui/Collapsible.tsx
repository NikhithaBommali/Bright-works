import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface CollapsibleProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

export function Collapsible({ id, title, isOpen, onToggle, children, className }: CollapsibleProps) {
  return (
    <div className={cn('rounded-2xl border border-border/70 bg-background/50 p-4', className)}>
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-between rounded-lg px-0 py-0 text-left text-sm font-medium"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {isOpen ? <div id={id} className="mt-3">{children}</div> : null}
    </div>
  );
}
