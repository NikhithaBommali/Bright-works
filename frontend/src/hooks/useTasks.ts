import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask, type Task, type TaskPayload } from '../api-client/tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setTasks([]);
      setError(err instanceof Error ? err.message : 'Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const addTask = async (payload: TaskPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createTask(payload);
      setTasks((current) => [created, ...current]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create task.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editTask = async (id: number, payload: TaskPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateTask(id, payload);
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTask = async (id: number) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete task.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tasks,
    isLoading,
    error,
    isSubmitting,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    clearError: () => setError(null)
  };
}
