import { useEffect, useState } from 'react';
import { FileText, Plus, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { Task, TaskPayload, TaskStatus } from '../../api-client/tasks';

interface TaskFormProps {
  initialTask?: Task | null;
  isSubmitting: boolean;
  onSubmit: (payload: TaskPayload) => Promise<void>;
  onCancelEdit: () => void;
}

const defaultValues: TaskPayload = {
  title: '',
  description: '',
  status: 'todo'
};

export function TaskForm({ initialTask, isSubmitting, onSubmit, onCancelEdit }: TaskFormProps) {
  const [form, setForm] = useState<TaskPayload>(defaultValues);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setForm({
        title: initialTask.title,
        description: initialTask.description,
        status: initialTask.status
      });
      setLocalError(null);
      return;
    }

    setForm(defaultValues);
    setLocalError(null);
  }, [initialTask]);

  const updateField = <K extends keyof TaskPayload>(key: K, value: TaskPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.title.trim() || !form.description.trim()) {
      setLocalError('Title and description are required.');
      return;
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status
    });

    if (!initialTask) {
      setForm(defaultValues);
    }
  };

  const handleCancel = () => {
    setForm(defaultValues);
    setLocalError(null);
    onCancelEdit();
  };

  return (
    <Card className="p-6 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-teal">{initialTask ? 'Edit task' : 'Create task'}</p>
          <h2 className="mt-1 text-xl font-semibold text-card-foreground">
            {initialTask ? 'Refine the task details' : 'Capture the next piece of work'}
          </h2>
        </div>
        <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
          <FileText className="h-5 w-5" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <Input
            id="title"
            name="title"
            placeholder="Launch onboarding checklist"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Add the core details, owners, or what success looks like."
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-foreground">
            Status
          </label>
          <Select
            id="status"
            name="status"
            value={form.status}
            onChange={(event) => updateField('status', event.target.value as TaskStatus)}
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </div>

        {localError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{localError}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {initialTask ? (
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel edit
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={initialTask ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {isSubmitting ? 'Saving...' : initialTask ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
