import { FormEvent, useEffect, useMemo, useState } from 'react';

type TaskStatus = 'todo' | 'in_progress' | 'done';

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
};

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const initialFormValues: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo'
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formValues, setFormValues] = useState<TaskFormValues>(initialFormValues);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({});

  const submitLabel = useMemo(() => (editingTaskId === null ? 'Create task' : 'Save changes'), [editingTaskId]);

  useEffect(() => {
    void loadTasks();
  }, []);

  async function loadTasks() {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(`${API_BASE}/api/tasks`);

      if (!response.ok) {
        throw new Error('Failed to load tasks. Please try again.');
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(values: TaskFormValues) {
    const nextFieldErrors: Partial<Record<keyof TaskFormValues, string>> = {};

    if (!values.title.trim()) {
      nextFieldErrors.title = 'Title is required.';
    }

    if (!values.description.trim()) {
      nextFieldErrors.description = 'Description is required.';
    }

    if (!values.status) {
      nextFieldErrors.status = 'Status is required.';
    }

    setFieldErrors(nextFieldErrors);

    return Object.keys(nextFieldErrors).length === 0;
  }

  function resetForm() {
    setFormValues(initialFormValues);
    setEditingTaskId(null);
    setFieldErrors({});
    setFormError('');
    setFormSuccess('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!validateForm(formValues)) {
      setFormError('Please correct the highlighted fields.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: TaskFormValues = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        status: formValues.status
      };

      const url = editingTaskId === null ? `${API_BASE}/api/tasks` : `${API_BASE}/api/tasks/${editingTaskId}`;
      const method = editingTaskId === null ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(editingTaskId === null ? 'Failed to create task.' : 'Failed to update task.');
      }

      await loadTasks();
      setFormValues(initialFormValues);
      setEditingTaskId(null);
      setFieldErrors({});
      setFormError('');
      setFormSuccess(editingTaskId === null ? 'Task created successfully.' : 'Task updated successfully.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setFormValues({
      title: task.title,
      description: task.description,
      status: task.status
    });
    setFieldErrors({});
    setFormError('');
    setFormSuccess('');
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingTaskId(task.id);
    setLoadError('');
    setFormSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task.');
      }

      setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
      if (editingTaskId === task.id) {
        resetForm();
      }
      setFormSuccess('Task deleted successfully.');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to delete task. Please try again.');
    } finally {
      setDeletingTaskId(null);
    }
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '0 auto', maxWidth: 960, padding: '2rem' }}>
      <h1>TaskFlow</h1>
      <p>Manage your tasks from one place.</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2>{editingTaskId === null ? 'Create a task' : 'Edit task'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: 480 }}>
            <label>
              Title
              <input
                type="text"
                value={formValues.title}
                onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
                aria-invalid={Boolean(fieldErrors.title)}
              />
            </label>
            {fieldErrors.title ? <p role="alert">{fieldErrors.title}</p> : null}

            <label>
              Description
              <textarea
                value={formValues.description}
                onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
                aria-invalid={Boolean(fieldErrors.description)}
                rows={4}
              />
            </label>
            {fieldErrors.description ? <p role="alert">{fieldErrors.description}</p> : null}

            <label>
              Status
              <select
                value={formValues.status}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, status: event.target.value as TaskStatus }))
                }
                aria-invalid={Boolean(fieldErrors.status)}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            {fieldErrors.status ? <p role="alert">{fieldErrors.status}</p> : null}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : submitLabel}
              </button>
              {editingTaskId !== null ? (
                <button type="button" onClick={resetForm} disabled={isSaving}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </form>
        {formError ? <p role="alert">{formError}</p> : null}
        {formSuccess ? <p>{formSuccess}</p> : null}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2>Tasks</h2>
          <button type="button" onClick={() => void loadTasks()} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loadError ? <p role="alert">{loadError}</p> : null}

        {isLoading ? <p>Loading tasks...</p> : null}

        {!isLoading && tasks.length === 0 ? <p>No tasks yet. Create your first task above.</p> : null}

        {!isLoading && tasks.length > 0 ? (
          <ul style={{ display: 'grid', gap: '1rem', listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <p>
                      <strong>Status:</strong> {task.status}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <button type="button" onClick={() => startEdit(task)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(task)}
                      disabled={deletingTaskId === task.id}
                    >
                      {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

export default App;
