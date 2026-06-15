import { FormEvent, useEffect, useMemo, useState } from 'react';

type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
};

type TaskPayload = {
  title: string;
  description: string;
  status: string;
};

type FormState = {
  title: string;
  description: string;
  status: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const initialFormState: FormState = {
  title: '',
  description: '',
  status: 'todo'
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const isEditing = editingId !== null;
  const submitLabel = useMemo(() => (isEditing ? 'Save changes' : 'Create task'), [isEditing]);

  useEffect(() => {
    void loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/tasks`);

      if (!response.ok) {
        throw new Error('Unable to load tasks.');
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialFormState);
    setEditingId(null);
    setFormError('');
  }

  function startEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description,
      status: task.status
    });
    setEditingId(task.id);
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    const payload: TaskPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEditing ? `${API_BASE}/api/tasks/${editingId}` : `${API_BASE}/api/tasks`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(isEditing ? 'Unable to save task.' : 'Unable to create task.');
      }

      await loadTasks();
      resetForm();
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Unable to delete task.');
      }

      if (editingId === id) {
        resetForm();
      }

      await loadTasks();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete task.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Task manager</p>
          <h1>TaskFlow</h1>
          <p className="hero-text">
            Organize your work in one place. Create tasks, track status, and edit details without leaving the homepage.
          </p>
        </div>
      </section>

      <section className="workspace-grid" aria-label="TaskFlow workspace">
        <article className="card">
          <div className="section-header">
            <div>
              <h2>{isEditing ? 'Edit task' : 'Create a task'}</h2>
              <p>{isEditing ? 'Update the selected task and save your changes.' : 'Add a new task with a clear title, description, and status.'}</p>
            </div>
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Plan sprint kickoff"
              />
            </div>

            <div className="field-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Capture the goal, owner, and next steps"
              />
            </div>

            <div className="field-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
              </select>
            </div>

            {formError ? <p className="feedback error-message">{formError}</p> : null}

            <div className="form-actions">
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : submitLabel}
              </button>
              <button className="button secondary" type="button" onClick={resetForm} disabled={saving && !isEditing ? true : false}>
                {isEditing ? 'Cancel edit' : 'Clear form'}
              </button>
            </div>
          </form>
        </article>

        <article className="card">
          <div className="section-header section-header-row">
            <div>
              <h2>Tasks</h2>
              <p>{tasks.length} total task{tasks.length === 1 ? '' : 's'}</p>
            </div>
            <button className="button tertiary" type="button" onClick={() => void loadTasks()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {error ? (
            <div className="state-block" role="alert">
              <p className="feedback error-message">{error}</p>
              <button className="button secondary" type="button" onClick={() => void loadTasks()}>
                Retry
              </button>
            </div>
          ) : null}

          {loading ? <div className="state-block">Loading tasks…</div> : null}

          {!loading && !error && tasks.length === 0 ? (
            <div className="state-block">
              <p>No tasks yet.</p>
              <p className="muted">Create your first task to get started.</p>
            </div>
          ) : null}

          {!loading && !error && tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className="task-item">
                  <div className="task-item-main">
                    <div className="task-item-header">
                      <h3>{task.title}</h3>
                      <span className="status-badge">{task.status}</span>
                    </div>
                    <p className="task-description">{task.description || 'No description provided.'}</p>
                  </div>
                  <div className="task-item-actions">
                    <button className="button secondary" type="button" onClick={() => startEdit(task)}>
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => void handleDelete(task.id)}
                      disabled={deletingId === task.id}
                    >
                      {deletingId === task.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}
