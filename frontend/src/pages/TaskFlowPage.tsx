import { useMemo, useState } from 'react';
import { AlertCircle, CheckCheck, Clock3, ListTodo } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { TaskForm } from '../components/features/TaskForm';
import { TaskList } from '../components/features/TaskList';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskPayload } from '../api-client/tasks';

export function TaskFlowPage() {
  const { tasks, isLoading, error, isSubmitting, loadTasks, addTask, editTask, removeTask, clearError } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length
    }),
    [tasks]
  );

  const handleSubmit = async (payload: TaskPayload) => {
    if (editingTask) {
      await editTask(editingTask.id, payload);
      setEditingTask(null);
      return;
    }

    await addTask(payload);
  };

  const handleDelete = async (task: Task) => {
    await removeTask(task.id);
    if (editingTask?.id === task.id) {
      setEditingTask(null);
    }
  };

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-teal">Workspace pulse</p>
                <h2 className="mt-1 text-xl font-semibold">See progress at a glance</h2>
              </div>
              <div className="rounded-2xl bg-gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
                {summary.total} total
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-border/60 bg-secondary/70 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-background p-2 text-foreground">
                    <ListTodo className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">Todo</p>
                </div>
                <p className="text-2xl font-semibold">{summary.todo}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-accent/10 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-background p-2 text-foreground">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">In progress</p>
                </div>
                <p className="text-2xl font-semibold">{summary.inProgress}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-primary/10 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-background p-2 text-foreground">
                    <CheckCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">Done</p>
                </div>
                <p className="text-2xl font-semibold">{summary.done}</p>
              </div>
            </div>
          </Card>

          <TaskForm
            initialTask={editingTask}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingTask(null)}
          />
        </div>

        <div className="space-y-6">
          {error ? (
            <Card className="border-destructive/30 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Request issue</p>
                    <p className="text-sm text-destructive/90">{error}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-teal">Task board</p>
              <h2 className="mt-1 text-2xl font-semibold">Current tasks</h2>
            </div>
            <Button type="button" variant="outline" onClick={() => void loadTasks()}>
              Refresh
            </Button>
          </div>

          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            error={error}
            onRetry={() => void loadTasks()}
            onEdit={(task) => {
              clearError();
              setEditingTask(task);
            }}
            onDelete={handleDelete}
          />
        </div>
      </section>
    </AppShell>
  );
}
