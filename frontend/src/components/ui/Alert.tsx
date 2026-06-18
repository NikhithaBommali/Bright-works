import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
}

export function Alert({ className, tone = 'info', children, ...props }: AlertProps) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  const toneClasses =
    tone === 'error'
      ? 'border-destructive/40 bg-destructive/10 text-destructive-foreground'
      : tone === 'success'
        ? 'border-primary/30 bg-primary/10 text-foreground'
        : 'border-border bg-secondary/60 text-foreground';

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', toneClasses, className)} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
