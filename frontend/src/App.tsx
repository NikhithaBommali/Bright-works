import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type Todo,
} from './api-client/todos';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Skeleton } from './components/ui/Skeleton';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message || 'Unable to load todos right now.';
  }
  return 'Unable to load todos right now.';
}

function sortTodos(todos: Todo[]) {
  return [...todos].sort((a, b) => Number(new Date(b.created_at)) - Number(new Date(a.created_at)));
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const remainingCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  const loadTodos = async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await fetchTodos();
      setTodos(sortTodos(data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;

    try {
      setIsSubmitting(true);
      setError('');
      const created = await createTodo({ title: nextTitle });
      setTodos((current) => sortTodos([created, ...current]));
      setTitle('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      setBusyId(todo.id);
      setError('');
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (todoId: string) => {
    try {
      setBusyId(todoId);
      setError('');
      await deleteTodo(todoId);
      setTodos((current) => current.filter((item) => item.id !== todoId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="space-y-5">
            <Badge className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">Todo App</Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Keep your day moving with a clean, fast todo flow.</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Add tasks, mark them complete, and remove anything you no longer need without a page reload. Everything stays in sync with the backend API.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4" /> {todos.length} total
              </Badge>
              <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1.5 text-sm">
                <Circle className="h-4 w-4" /> {remainingCount} active
              </Badge>
            </div>
          </div>

          <Card className="space-y-4 rounded-[1.75rem] border-border/70 bg-background/80 p-5 shadow-none sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="todo-title" className="text-sm font-medium text-foreground">
                  New todo
                </label>
                <Input
                  id="todo-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Plan the next sprint"
                  aria-label="Todo title"
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !title.trim()} className="w-full sm:w-auto" iconLeft={<Plus className="h-4 w-4" />}>
                {isSubmitting ? 'Adding...' : 'Add todo'}
              </Button>
            </form>
            {error ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold sm:text-xl">Your tasks</h2>
          <p className="text-sm text-muted-foreground">{todos.length} items</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="rounded-3xl p-4">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="mt-3 h-4 w-2/5" />
              </Card>
            ))}
          </div>
        ) : todos.length ? (
          <div className="grid gap-3">
            {todos.map((todo) => (
              <Card key={todo.id} className="group flex items-center gap-4 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <button
                  type="button"
                  aria-label={todo.completed ? 'Mark todo as incomplete' : 'Mark todo as complete'}
                  onClick={() => void handleToggle(todo)}
                  disabled={busyId === todo.id}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {todo.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium sm:text-base ${todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{todo.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(todo.updated_at).toLocaleString()}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(todo.id)}
                  disabled={busyId === todo.id}
                  aria-label={`Delete ${todo.title}`}
                  iconLeft={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl p-8 text-center">
            <p className="text-base font-medium">No todos yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first task above to get started.</p>
          </Card>
        )}
      </section>
    </main>
  );
}
