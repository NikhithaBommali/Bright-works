import { CheckCircle2, ClipboardList, Loader2, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Task } from '../../api-client/tasks';
import { cn } from '../../utils/cn';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}

const statusStyles: Record<Task['status'], string> = {
  todo: 'bg-secondary text-secondary-foreground',
  'in-progress': 'bg-accent/15 text-accent-foreground border border-accent/25',
  done: 'bg-primary/15 text-primary border border-primary/25'
};

const statusLabels: Record<Task['status'], string> = {
  todo: 'Todo',
  'in-progress': 'In progress',
  done: 'Done'
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border/60 bg-card/70 p-5">
      <div className="mb-4 h-4 w-24 rounded bg-muted" />
      <div className="mb-3 h-6 w-2/3 rounded bg-muted" />
      <div className="mb-2 h-4 w-full rounded bg-muted" />
      <div className="mb-5 h-4 w-4/5 rounded bg-muted" />
      <div className="flex gap-3">
        <div className="h-10 w-24 rounded bg-muted" />
        <div className="h-10 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}

export function TaskList({ tasks, isLoading, isSubmitting, error, onRetry, onEdit, onDelete }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">Unable to load tasks</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="outline" onClick={onRetry} iconLeft={<RefreshCcw className="h-4 w-4" />}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">No tasks yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first task to start organizing work across todo, in progress, and done.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                    statusStyles[task.status]
                  )}
                >
                  {statusLabels[task.status]}
                </span>
                <span className="text-xs text-muted-foreground">Task #{task.id}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{task.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{task.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onEdit(task)} iconLeft={<Pencil className="h-4 w-4" />}>
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isSubmitting}
                onClick={() => void onDelete(task)}
                iconLeft={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
