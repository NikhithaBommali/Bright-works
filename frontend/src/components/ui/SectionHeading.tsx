import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <div className="mb-2 text-sm font-medium text-primary">{eyebrow}</div> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-copy mt-1">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
