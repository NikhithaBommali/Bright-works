import { CheckCircle2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BaseLayout } from './components/layout/BaseLayout';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Skeleton } from './components/ui/Skeleton';
import { useDarkMode } from './hooks/useDarkMode';
import { cn } from './utils/cn';
import { ApiError, createTodo, deleteTodo, fetchTodos, type Todo, updateTodo } from './api-client/todos';

function formatRelativeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return 'Unable to load todos right now. Please try again.';
}

function TodoSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { isDark, toggleTheme } = useDarkMode(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const completedCount = useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError('');
      setTodos(await fetchTodos());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      const created = await createTodo({ title: trimmed });
      setTodos((current) => [created, ...current]);
      setTitle('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      setBusyId(todo.id);
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setBusyId(id);
      await deleteTodo(id);
      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Total todos</p>
        <p className="mt-2 text-3xl font-semibold">{todos.length}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Completed</p>
        <p className="mt-2 text-3xl font-semibold">{completedCount}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Remaining</p>
        <p className="mt-2 text-3xl font-semibold">{todos.length - completedCount}</p>
      </Card>
    </div>
  );

  const sidebar = (
    <Card className="p-5">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label htmlFor="todo-title" className="mb-2 block text-sm font-medium text-foreground">New todo</label>
          <Input id="todo-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" aria-required="true" />
        </div>
        <Button type="submit" className="w-full" disabled={submitting || !title.trim()} aria-disabled={submitting || !title.trim()} iconLeft={<Plus className="h-4 w-4" />}>
          {submitting ? 'Adding todo...' : 'Add todo'}
        </Button>
      </form>
    </Card>
  );

  const content = (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your todos</h2>
          <p className="text-sm text-muted-foreground">Create, complete, and remove items instantly.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadTodos()} disabled={loading} aria-disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Couldn’t load todos.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <TodoSkeleton />
      ) : todos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-brand" />
          <h3 className="mt-4 text-lg font-semibold">No todos yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add your first task above to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li key={todo.id} className="rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => void handleToggle(todo)}
                  disabled={busyId === todo.id}
                  aria-label={todo.completed ? 'Mark todo as incomplete' : 'Mark todo as complete'}
                  className={cn(
                    'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    todo.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary',
                  )}
                >
                  {todo.completed ? <CheckCircle2 className="h-4 w-4" /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-base font-medium', todo.completed && 'text-muted-foreground line-through')}>{todo.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Created {formatRelativeDate(todo.created_at)}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(todo.id)} disabled={busyId === todo.id} aria-label={`Delete ${todo.title}`}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return <BaseLayout isDark={isDark} onToggleTheme={toggleTheme} header={header} sidebar={sidebar} content={content} />;
}
