import { FormEvent, useEffect, useMemo, useState } from 'react';

type TaskStatus = 'todo' | 'in-progress' | 'done';

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
};

type TaskPayload = {
  title: string;
  description: string;
  status: TaskStatus;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const emptyForm: TaskPayload = {
  title: '',
  description: '',
  status: 'todo'
};

const statusOptions: TaskStatus[] = ['todo', 'in-progress', 'done'];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const formTitle = useMemo(() => (editingTaskId === null ? 'Create task' : 'Edit task'), [editingTaskId]);

  async function loadTasks() {
    try {
      setIsLoading(true);
      setError('');
      const data = await request<Task[]>('/tasks');
      setTasks(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingTaskId(null);
  }

  function startEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description,
      status: task.status
    });
    setEditingTaskId(task.id);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError('');

      if (editingTaskId === null) {
        await request<Task>(`/tasks`, {
          method: 'POST',
          body: JSON.stringify(form)
        });
      } else {
        await request<Task>(`/tasks/${editingTaskId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      }

      resetForm();
      await loadTasks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(`Delete task "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await request<void>(`/tasks/${task.id}`, {
        method: 'DELETE'
      });
      if (editingTaskId === task.id) {
        resetForm();
      }
      await loadTasks();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete task');
    }
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '0 auto', maxWidth: 960, padding: '2rem' }}>
      <h1>TaskFlow</h1>
      <p>Manage tasks with create, edit, and delete actions.</p>

      <section aria-labelledby="task-form-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="task-form-heading">{formTitle}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: 480 }}>
            <div>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                style={{ display: 'block', width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                required
                style={{ display: 'block', width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                style={{ display: 'block', width: '100%', padding: '0.5rem' }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingTaskId === null ? 'Create task' : 'Save changes'}
              </button>
              {editingTaskId !== null ? (
                <button type="button" onClick={resetForm} disabled={isSubmitting}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      <section aria-labelledby="task-list-heading">
        <h2 id="task-list-heading">Tasks</h2>

        {error ? (
          <div role="alert" style={{ color: '#b91c1c', marginBottom: '1rem' }}>
            {error}
          </div>
        ) : null}

        {isLoading ? <p>Loading tasks...</p> : null}

        {!isLoading && tasks.length === 0 ? <p>No tasks yet. Create your first task above.</p> : null}

        {!isLoading && tasks.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: '1rem' }}>
                <article>
                  <h3 style={{ marginTop: 0 }}>{task.title}</h3>
                  <p>{task.description}</p>
                  <p>
                    <strong>Status:</strong> {task.status}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={() => startEdit(task)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(task)}>
                      Delete
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
