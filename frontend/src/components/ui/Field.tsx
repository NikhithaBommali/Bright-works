import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, required = false, error, hint, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={cn('text-xs text-destructive')} role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {describedBy ? <span className="sr-only">{describedBy}</span> : null}
    </div>
  );
}
