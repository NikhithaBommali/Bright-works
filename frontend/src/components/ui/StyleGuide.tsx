import { CheckCircle2, Search, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Skeleton } from './Skeleton';
import { Textarea } from './Textarea';

export function StyleGuide() {
  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/15 p-3 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">BrightCone UI style guide</h3>
          <p className="text-sm text-muted-foreground">Reusable controls, semantic tokens, and polished interaction states.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Button iconLeft={<CheckCircle2 className="h-4 w-4" />}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Inputs</p>
          <Input aria-label="Style guide search" placeholder="Search contacts" value="" readOnly icon-name="search" />
          <Textarea aria-label="Style guide notes" placeholder="Notes and descriptions" readOnly value="Thoughtful labels and validation states." />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge>Primary</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge variant="accent">Accent</Badge>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Loading</p>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
