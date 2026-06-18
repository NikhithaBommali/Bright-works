import { AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface EmptyPlannerProps {
  onPlanToday: () => void;
  disabled: boolean;
}

export function EmptyPlanner({ onPlanToday, disabled }: EmptyPlannerProps) {
  return (
    <Card className="rounded-3xl p-8 sm:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="rounded-full bg-primary/10 p-4 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-foreground">Plan stress-free meals for today</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Generate four kid-friendly ideas tailored to your family preferences, then swap any slot until the day feels just right.
        </p>
        <Button onClick={onPlanToday} disabled={disabled} aria-disabled={disabled} className="mt-6" size="lg">
          Plan today's meals
        </Button>
      </div>
    </Card>
  );
}

interface PlannerErrorProps {
  message: string;
  onRetry: () => void;
  disabled: boolean;
}

export function PlannerError({ message, onRetry, disabled }: PlannerErrorProps) {
  return (
    <Card className="rounded-3xl border-destructive/40 p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">We couldn't generate a meal plan right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry} disabled={disabled} aria-disabled={disabled}>
          Try again
        </Button>
      </div>
    </Card>
  );
}

export function MealCardsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} className="overflow-hidden rounded-3xl p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-8 w-1/2 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <div className="flex gap-3">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
